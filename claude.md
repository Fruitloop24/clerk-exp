# Clerk Experimental Repo - Context

## Purpose
This is an **experimental repository** for developing and testing a working production SaaS demo site. The demo will be used to showcase an open source project.

## Repository Workflow

### This Repo (clerk-exp)
- **Role**: Experimental/testing environment
- **Purpose**: Develop, test, and iterate on features locally
- **Git Setup**:
  - Branch: `master` (not main - keeping it old school)
  - Remote: `origin`
- **Work Process**: All development and testing happens here first

### Sister Production Repo
- **Role**: Production deployment repository
- **Deployment Process**:
  1. Test and verify changes in this experimental repo
  2. Copy working changes to sister production repo
  3. Push from sister repo to its GitHub remote

## Git Configuration
- Primary branch: `master`
- Remote name: `origin`
- Status: Initialized locally, ready to connect to GitHub remote

## Development Notes
- Always test locally in this repo first
- Only promote stable, tested changes to the production repo
- This repo gives freedom to experiment without affecting production
