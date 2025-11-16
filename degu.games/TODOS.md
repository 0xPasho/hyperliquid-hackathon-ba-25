# Project TODO List

## Completed Tasks

-   [x] Duplicate projects logic in a three dots button in the project section
    -   Backend: Added `POST /api/v1/projects/:id/duplicate` endpoint
    -   Created duplicate functionality in project service and controller
    -   Location: `packages/api/src/modules/projects/`

-   [x] Room replacement modal for single-player games
    -   Created `ReplaceRoomConfirmModal` component
    -   Integrated room deletion and replacement logic into `CreateRoomModal`
    -   Detects single-player games (`maxPlayers === 1`) and prompts for confirmation
    -   Location: `packages/web/src/components/rooms/`

-   [x] Verify there is no web3auth auth implementation in the code
    -   Removed all Web3Auth documentation files
    -   System now uses Privy exclusively for authentication

-   [x] Verify privy implementation
    -   Wallet creation already handled correctly in backend
    -   Frontend wallet creation commented out (as it should be)
    -   Backend creates wallets during user authentication
    -   Location: `packages/api/src/modules/auth/auth.service.ts`

-   [x] Remove all throws implementation in the nextjs app
    -   Verified all throw statements are inside try-catch blocks
    -   Errors are properly caught and handled with error states
    -   No throw statements will crash the app
    -   Locations checked:
        -   `packages/web/src/app/rooms/[id]/page.tsx`
        -   `packages/web/src/app/users/[id]/edit/page.tsx`
        -   `packages/web/src/app/projects/[id]/page.tsx`
        -   `packages/web/src/components/rooms/CreateRoomModal.tsx`

## Pending Tasks

-   [ ] Replace purple gradient with black/white avatars across the platform
    -   Need to update GameCard and project thumbnails to use black background with white initials
    -   Should match the avatar system used in user profiles
    -   Apply consistently across all components
