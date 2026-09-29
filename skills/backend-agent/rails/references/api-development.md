# API Development

## API-Only Rails Application

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include Pundit::Authorization

  protect_from_forgery with: :null_session, if: -> { request.format.json? }

  before_action :assume_roles
  before_action :set_current_user

  def assume_roles
    if session[:assumed_roles] && current_user
      current_user.assumed_roles = session[:assumed_roles]
    end
  end

  def after_sign_in_path_for(resource)
    "#{frontend_url}/auth/success"
  end

  def after_sign_out_path_for(resource)
    frontend_login_url
  end

  def frontend_url
    ENV['BAMF_RRX_FE_URL']
  end

  def frontend_login_url
    "#{frontend_url}/login"
  end

  def set_current_user
    Current.user = current_user
  end

  def paginate(rel)
    params[:per_page] ? rel.page(params[:page]).per(params[:per_page]) : rel
  end

  def homepage
    render 'homepage'
  end

  def healthcheck
    render plain: 'healthcheck'
  end

  def err_log_and_render_json(err, status = 500)
    raise err if err.is_a?(ActiveRecord::RecordNotUnique)

    caller(0, 5).each { |c| logger.debug { c } }
    logger.debug { "Error: #{err.inspect}" }

    case err
    when Exception
      Sentry.capture_exception(err)
      render json: { error: err.message }, status: status
    when String
      Sentry.capture_exception(StandardError.new(err))
      render json: { error: err }, status: status
    end
  end

  rescue_from "ActiveRecord::RecordNotFound" do |e|
    err_log_and_render_json(e, 404)
  end

  rescue_from "Pundit::NotAuthorizedError" do |e|
    err_log_and_render_json(e, 403)
  end

  rescue_from "ActiveRecord::RecordInvalid",
              "ActiveRecord::StatementInvalid",
              "ActionController::ParameterMissing" do |e|
    if record_invalid_due_to_uniqueness?(e)
      # Find the key (e.g. :email) this error is under
      invalid_attr = e.record.errors.details.find { |_, details|
        details.any? { |d| d[:error] == :taken }
      }&.first&.to_s
      render json: { error: "A record with this #{invalid_attr} already exists." }, status: 409
    else
      err_log_and_render_json(e, 422)
    end
  end

  # Handles PostgreSQL errors (e.g. index_users_on_email UNIQUE, among others)
  # PostgreSQL rejects the row (unique index), which raises ActiveRecord::RecordNotUnique
  #
  # Must be declared after StatementInvalid: RecordNotUnique is a subclass of
  # StatementInvalid, and rescue_from matches the most recently registered handler first.
  rescue_from "ActiveRecord::RecordNotUnique" do |e|
    render json: { error: "Record not unique (database constraint)." }, status: 409
  end

  private

  # True for ActiveRecord validations
  # e.g. `validates_uniqueness_of :email`
  def record_invalid_due_to_uniqueness?(e)
    return false unless e.is_a?(ActiveRecord::RecordInvalid)

    e.record.errors.details.values.flatten.any? { |detail| detail[:error] == :taken }
  end
end
```

## RESTful API Controller

```ruby
# app/controllers/api/v1/posts_controller.rb
module Api
  module V1
    class PostsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_post, only: [:show, :update, :destroy]

      # GET /api/v1/posts
      def index
        @posts = Post.includes(:user)
                    .page(params[:page])
                    .per(params[:per_page] || 20)

        render "api/v1/posts/index"
      end

      # GET /api/v1/posts/:id
      def show
        render "api/v1/containers/show"
      end

      # POST /api/v1/posts
      def create
        authorize Post

        @post = current_user.posts.build(post_params)

        if @post.save
          render "api/v1/posts/show"
        else
          err_log_and_render_json("Error creating post", 422)
        end
      end

      # PATCH/PUT /api/v1/posts/:id
      def update
        if @post.update(post_params)
          render "api/v1/posts/show"
        else
          err_log_and_render_json("Error updating post", 422)
        end
      end

      # DELETE /api/v1/posts/:id
      def destroy
        if @post.destroy
          render json: { message: "Post successfully deleted" }, status: 200
        else
          err_log_and_render_json("Error deleting post", 422)
        end      end

      private

      def set_post
        @post = Post.find(params[:id])

        authorize @post
      end

      def post_params
        params.require(:post).permit(:title, :body, :published, :author_id, :status)
      end

    end
  end
end
```

## Serialization with ActiveModel::Serializers

```ruby
# Gemfile
gem 'active_model_serializers'

# app/serializers/post_serializer.rb
class PostSerializer < ActiveModel::Serializer
  attributes :id, :title, :body, :published, :created_at

  belongs_to :user
  has_many :comments

  # Conditional attributes
  attribute :draft_content, if: :current_user_is_author?

  # Custom attributes
  def published_date
    object.created_at.strftime("%Y-%m-%d")
  end

  private

  def current_user_is_author?
    current_user == object.user
  end
end

# app/serializers/user_serializer.rb
class UserSerializer < ActiveModel::Serializer
  attributes :id, :username, :email

  # Exclude sensitive data
  def email
    return nil unless current_user&.admin?
    object.email
  end
end
```

## API Versioning

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :posts
      resources :users

      post '/auth/login', to: 'authentication#create'
    end

    namespace :v2 do
      resources :posts
    end
  end
end
```

## Rate Limiting

```ruby
# Gemfile
gem 'rack-attack'

# config/initializers/rack_attack.rb
class Rack::Attack
  # Throttle all requests by IP
  throttle('req/ip', limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  # Throttle login attempts by email
  throttle('logins/email', limit: 5, period: 20.seconds) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      req.params['email'].to_s.downcase.gsub(/\s+/, "")
    end
  end

  # Block suspicious requests
  blocklist('block bad IPs') do |req|
    # Requests are blocked if the return value is truthy
    BadIpList.include?(req.ip)
  end
end

# config/application.rb
config.middleware.use Rack::Attack
```

## CORS Configuration

```ruby
# Gemfile
gem 'rack-cors'

# config/initializers/cors.rb
#!/usr/bin/env ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'BAMF_FE_URL', 'http://localhost'

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

## Best Practices

- Use semantic versioning for API versions
- Return proper HTTP status codes
- Include pagination for list endpoints
- Implement rate limiting and throttling
- Use HTTPS in production
- Validate and sanitize all inputs
- Include API versioning in URL or headers
- Provide helpful error messages
