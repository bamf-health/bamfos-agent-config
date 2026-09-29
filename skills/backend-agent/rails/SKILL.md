---
name: "rails-expert"
version: 1.0.0
description: "Rails 7+ specialist that optimizes Active Record queries with includes/eager_load, configures Action Cable for WebSocket connections, and writes comprehensive RSpec test suites. Use when building Rails 7+ web applications with real-time features or background job processing. Invoke for Active Record optimization, Action Cable, RSpec Rails."
metadata:
  source: https://github.com/Jeffallan/claude-skills/tree/main/skills/rails-expert
---

# Rails Expert

## Core Workflow

1. **Analyze requirements** — Identify models, routes, real-time needs, background jobs
2. **Scaffold resources** — `rails generate model User name:string email:string`, `rails generate controller Users`
3. **Run migrations** — Run `rails db:migrate` and verify schema with `rails db:schema:dump`
  - If migration fails: inspect `db/schema.rb` for conflicts, rollback with `rails db:rollback`, fix and retry
4. **Implement** — Write controllers, models
5. **Validate** — `bundle exec test` must pass; `bundle exec rubocop` for style
  - If specs fail: check error output, fix failing examples, re-run with `--backtrace` for the full stack trace
  - If N+1 queries surface during review: add `includes`/`eager_load` (see Common Patterns) and re-run tests

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Active Record | `references/active-record.md` | Models, associations, queries, performance |
| API Development | `references/api-development.md` | API-only mode, serialization, authentication |

## Naming Conventions

- Use snake_case for files, methods, and variables
- Use PascalCase for classes and modules
- Follow Rails naming conventions for models, controllers, views

## Architecture & Performance

- Use ActiveRecord for database operations with proper indexing
- Implement eager loading to prevent N+1 query problems
- Apply fragment caching and Russian Doll caching strategies
- Use service objects for complex business logic
- Follow MVC architecture strictly

## Frontend & UI

- Use jbuilder for JSON rendering
- Maintain DRY views through helpers and partials

## Security

- Implement authentication/authorization via Devise
- Use strong parameters in controllers to prevent mass assignment vulnerabilities
- Sanitize user inputs appropriately
- Implement proper session management

## General Guidelines

- Keep controllers thin, models fat (but not too fat)
- Use concerns for shared functionality
- Implement background jobs with GoodJob
- Use proper database migrations
- Follow RESTful routing conventions

## Common Patterns

### N+1 Prevention with includes/eager_load

```ruby
# BAD — triggers N+1
posts = Post.all
posts.each { |post| puts post.author.name }

# GOOD — eager load association
posts = Post.includes(:author).all
posts.each { |post| puts post.author.name }

# GOOD — eager_load forces a JOIN (useful when filtering on association)
posts = Post.eager_load(:author).where(authors: { verified: true })
```

### Strong Parameters (controller template)

```ruby
# app/controllers/posts_controller.rb
module Api
  module V1
    class PostsController < ApplicationController
      before_action :set_post, only: [:show, :edit, :update, :destroy]

      def index
        @posts = Post.all

        # Add filtering, sorting, pagination, etc. here

        render "api/v1/posts/index"
      end

      def show
        render "api/v1/posts/show"
      end

      def create
        @post = Post.new(post_params)

        if @post.save

          render "api/v1/posts/show", status: 201
        else
          # Use a project-wide error response helper
          err_log_and_render_json("Error creating post", 422)
        end
      end

      def update
        if @post.update(post_params)
          render "api/v1/posts/show", status: 200
        else
          # Use a project-wide error response helper
          err_log_and_render_json("Error updating post", 422)
        end
      end

      def destroy
        # Handle destroy action either by deleting the record or soft deleting it
      end

      private

      def set_post
        @post = Post.find(params[:id])
      end

      def post_params
        params.require(:post).permit(
          :title,
          :body,
          :author_id,
          :status,
          :published_at,
        )
      end
    end
  end
end
```

## Constraints

### MUST DO
- Prevent N+1 queries with `includes`/`eager_load` on every collection query involving associations
- Write comprehensive specs targeting >95% coverage
- Use service objects for complex business logic; keep controllers thin
- Add database indexes for every column used in `WHERE`, `ORDER BY`, or `JOIN`
- Offload slow operations to Sidekiq — never run them synchronously in a request cycle

### MUST NOT DO
- Skip migrations for schema changes
- Use raw SQL without sanitization (`sanitize_sql` or parameterized queries only)
- Expose internal IDs in URLs without consideration

[Documentation](https://jeffallan.github.io/claude-skills/skills/backend/rails-expert/)
