import React from "react";
import ReactDOM from "react-dom";
import { compose } from "redux";

import AppStateHOC from "../lib/app-state-hoc.jsx";
import GUI from "../containers/gui.jsx";
import HashParserHOC from "../lib/hash-parser-hoc.jsx";
import log from "../lib/log.js";
import { PLATFORM } from "../lib/platform.js";
import authManager from "../lib/auth-manager";

const onClickLogo = () => {
    window.location = process.env.SITE_URL; //"https://degu.games";
};

const handleTelemetryModalCancel = () => {
    log("User canceled telemetry modal");
};

const handleTelemetryModalOptIn = () => {
    log("User opted into telemetry");
};

const handleTelemetryModalOptOut = () => {
    log("User opted out of telemetry");
};

/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default async (appTarget) => {
    GUI.setAppElement(appTarget);

    // CRITICAL: Initialize auth manager BEFORE rendering GUI
    // This ensures the session is established before any blockchain blocks try to access it
    console.log("[Editor] Initializing auth manager...");
    await authManager.init();

    // Make it available globally for blockchain extension
    window.authManager = authManager;
    window.dispatchEvent(new Event("authManagerReady"));

    // Log auth status
    if (authManager.isAuthenticated()) {
        const user = authManager.getUser();
        console.log("[Editor] ✅ User authenticated:", {
            id: user?.id,
            name: user?.name,
            email: user?.email,
            wallet: authManager.getWalletAddress(),
            fullUser: user,
        });
    } else {
        console.log(
            "[Editor] ⚠️  No user authenticated - blockchain blocks will return empty values"
        );
        console.log("[Editor] Debug info:", {
            hasToken: !!authManager.getToken(),
            hasUser: !!authManager.getUser(),
            hasWallet: !!authManager.getWalletAddress(),
        });
    }

    // note that redux's 'compose' function is just being used as a general utility to make
    // the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
    // ability to compose reducers.
    const WrappedGui = compose(AppStateHOC, HashParserHOC)(GUI);

    // TODO a hack for testing the backpack, allow backpack host to be set by url param
    const backpackHostMatches = window.location.href.match(
        /[?&]backpack_host=([^&]*)&?/
    );
    const backpackHost = backpackHostMatches ? backpackHostMatches[1] : null;

    const scratchDesktopMatches = window.location.href.match(
        /[?&]isScratchDesktop=([^&]+)/
    );
    let simulateScratchDesktop;
    if (scratchDesktopMatches) {
        try {
            // parse 'true' into `true`, 'false' into `false`, etc.
            simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
        } catch {
            // it's not JSON so just use the string
            // note that a typo like "falsy" will be treated as true
            simulateScratchDesktop = scratchDesktopMatches[1];
        }
    }

    if (process.env.NODE_ENV === "production" && typeof window === "object") {
        // Warn before navigating away
        window.onbeforeunload = () => true;
    }

    // Generate a random username for multiplayer
    const generateUsername = () => {
        const randomId = Math.floor(Math.random() * 10000);
        return `player${randomId}`;
    };

    // Get authenticated user data
    const user = authManager.getUser();
    // Try multiple possible property names for username
    const username = user
        ? user.name || user.username || user.displayName || generateUsername()
        : generateUsername();

    // Debug logging for username resolution
    console.log("[Editor] Username resolution:", {
        hasUser: !!user,
        userName: user?.name,
        userUsername: user?.username,
        userDisplayName: user?.displayName,
        resolvedUsername: username,
        fullUser: user,
    });

    // Build account menu options with user data
    const accountMenuOptions = {
        canHaveSession: true,
        canRegister: !authManager.isAuthenticated(),
        canLogin: !authManager.isAuthenticated(),
        canLogout: authManager.isAuthenticated(),
        avatarUrl: user?.photo || user?.profileImage || user?.image || null,
        profileUrl: user ? `/users/${user.id}` : null,
        myStuffUrl: null, // We removed this
        myClassesUrl: null,
        myClassUrl: null,
        accountSettingsUrl: user ? "/settings" : null,
    };

    ReactDOM.render(
        // important: this is checking whether `simulateScratchDesktop` is truthy, not just defined!
        simulateScratchDesktop ? (
            <WrappedGui
                canEditTitle
                platform={PLATFORM.DESKTOP}
                showTelemetryModal
                canSave={true}
                cloudHost="localhost:9080"
                username={username}
                accountMenuOptions={accountMenuOptions}
                hasCloudPermission={true}
                onTelemetryModalCancel={handleTelemetryModalCancel}
                onTelemetryModalOptIn={handleTelemetryModalOptIn}
                onTelemetryModalOptOut={handleTelemetryModalOptOut}
            />
        ) : (
            <WrappedGui
                canEditTitle
                backpackVisible
                showComingSoon
                backpackHost={backpackHost}
                canSave={true}
                cloudHost="localhost:9080"
                username={username}
                accountMenuOptions={accountMenuOptions}
                hasCloudPermission={true}
                onClickLogo={onClickLogo}
            />
        ),
        appTarget
    );
};
