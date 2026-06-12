# @a5c-ai/babysitter-pi

**Link:** [https://pi.dev/packages/@a5c-ai/babysitter-pi](https://pi.dev/packages/@a5c-ai/babysitter-pi)

## Description
A command bridge for the Babysitter orchestration system. It simplifies the interaction with Babysitter by forwarding concise commands to specialized orchestration skills, removing the need to type full `/skill:` prefixes for every request.

## Commands
- `/babysit`: Load the main Babysitter orchestration skill.
- `/babysitter`: Alias for `/babysit`.
- `/plan`: Forward to the planning skill.
- `/observe`: Forward to the observation skill.
- `/doctor`: Forward to the system diagnostic skill.
- `/project-install`: Forward to the project onboarding skill.
- `/bs-resume`: Forward to the session resumption skill.
- `/retrospect`: Forward to the post-run analysis skill.
- `/yolo`: Run a non-interactive orchestration flow.

## Usage Examples
- **Initiate a Plan**: `/plan "Implement a new authentication flow using JWT"`
- **System Check**: `/doctor`
- **Resume Work**: `/bs-resume`
