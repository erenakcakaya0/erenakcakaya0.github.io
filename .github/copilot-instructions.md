# GitHub Copilot Instructions

## Project Overview
This project is a web application that showcases various projects using HTML and CSS. The structure is minimal, focusing on clarity and ease of navigation.

## Architecture
- **HTML Files**: The main structure is defined in HTML files located in the `apps` and `projects` directories.
- **CSS Files**: Styles are defined in `style.css` and `system.css`, which control the appearance of the application.

## Developer Workflows
1. **Adding New Projects**: To add a new project, create a new HTML file in the `apps/projects` directory and link it in the main `index.html` file.
2. **Styling**: Use the existing CSS files to maintain consistency in design. New styles can be added to `style.css` or `system.css` as needed.

## Project-Specific Conventions
- Use semantic HTML elements for better accessibility and SEO.
- Follow the existing CSS naming conventions to ensure styles are applied correctly.

## Integration Points
- The project relies on external CSS from `98.css` for a retro aesthetic. Ensure this link remains active for proper styling.

## Actionable Instructions for AI Agents
- When generating new components, ensure they adhere to the existing structure and styles.
- Use the provided CSS classes to maintain design consistency across the application.
- Always test new features in a local environment before pushing changes to the repository.