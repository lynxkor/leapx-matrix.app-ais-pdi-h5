# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Vue 3 mobile/H5 application built with Vite for Leap Motor's AIS PDI (Pre-Delivery Inspection) system. The app handles vehicle inspection workflows for dealerships and includes a demo section for showcasing features.

## Architecture & Structure
- **Framework**: Vue 3 with Composition API
- **Build System**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router with code splitting
- **UI Components**: Vant 4.x (mobile-first components)
- **Styling**: SCSS with responsive design based on 37.5px root font size
- **HTTP Client**: Axios for API requests
- **Code Quality**: ESLint, Stylelint, Prettier with Husky pre-commit hooks

## Environment Configuration
- Development/SIT: `VITE_API_BASE_URL=https://aisapi-sit.leapmotor.com`
- Different environments are handled via .env files: development, sit, uat, pre, prod
- Base path for production build is `/vehstock/`

## Key Features
- Mobile-responsive design with 37.5px rem scaling
- PDI module with list and detail views for vehicle inspections
- Demo section for showcasing components
- Layout system with baseLayout.vue in libs
- vConsole enabled in development mode for debugging

## Routing
- Home: `/` (demo landing page)
- Example/demo: `/example` and `/example/detail`
- PDI: `/pdi/list` and `/pdi/detail`
- Layout wrapper for PDI views using baseLayout.vue

## Key Dependencies
- Vue 3.5.18
- Vue Router 4.5.1
- Pinia for state management
- Vant 4.9.21 for mobile components
- Axios for HTTP requests
- VConsole for development debugging

## Common Commands
- `npm run dev` - Start development server with SSL
- `npm run local` - Start development server in dev mode
- `npm run sit` - Build for SIT environment
- `npm run uat` - Build for UAT environment
- `npm run build` - Build for production environment
- `npm run preview` - Preview built application
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

## Development Guidelines
- Use Vant components for consistent mobile UX
- Leverage Pinia stores for state management (global store in src/stores/)
- Use `@` alias for imports from src directory
- Components are in src/components/, views in src/views/
- API integration in src/api/ directory
- Responsive design using rem units based on 37.5px root (see main.js)
- Component imports in main.js are explicit for tree-shaking
- Git hooks enforce code quality via lint-staged

## PDI-Specific Considerations
- The PDI module is the core business feature (routes under /pdi/)
- Recent commits indicate ongoing development of PDI functionality
- Permissions-based UI (as seen in fix for button display conditions)
- API integration with aisapi service