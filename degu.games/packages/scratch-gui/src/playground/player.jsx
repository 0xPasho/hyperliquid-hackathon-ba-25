import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {compose} from 'redux';
import queryString from 'query-string';

import Box from '../components/box/box.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import authManager from '../lib/auth-manager';
import VMSyncManager from '../lib/vm-sync-manager';

import {setPlayer, setFullScreen} from '../reducers/mode';
import {setStageSize} from '../reducers/stage-size';
import {STAGE_DISPLAY_SIZES} from '../lib/layout-constants';

if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
    // Warn before navigating away
    window.onbeforeunload = () => true;
}

import styles from './player.css';

// Parse query parameters
const queryParams = queryString.parse(window.location.search);
const showControls = queryParams.controls === 'true';

// If project ID is in query params but not in hash, set it in hash
// This allows using ?id=123 instead of #123
if (queryParams.id && !window.location.hash) {
    window.location.hash = `#${queryParams.id}`;
}

// Initialize auth manager
authManager.init().then(() => {
    console.log('[Player] Auth manager initialized');
    // Make it available globally for blockchain extension
    window.authManager = authManager;
    window.dispatchEvent(new Event('authManagerReady'));

    // Log auth status
    if (authManager.isAuthenticated()) {
        console.log('[Player] User authenticated:', {
            username: authManager.getUser()?.username,
            wallet: authManager.getWalletAddress()
        });
    } else {
        console.log('[Player] No user authenticated');
    }
});

class Player extends React.Component {
    constructor (props) {
        super(props);
        this.handleVMInitialized = this.handleVMInitialized.bind(this);
        this.handleParentMessage = this.handleParentMessage.bind(this);
        this.vmSyncManager = null;
    }

    componentDidMount () {
        // Enable fullscreen mode for player
        this.props.onSetFullScreen(true);
        this.props.onSetStageSize(STAGE_DISPLAY_SIZES.large);

        // Listen for messages from parent window (room page)
        window.addEventListener('message', this.handleParentMessage);

        // Auto-start the VM if controls are not shown
        if (!showControls && this.props.vm) {
            // Wait a bit for the project to load
            setTimeout(() => {
                if (this.props.vm) {
                    this.props.vm.start();
                    this.props.vm.greenFlag();
                }
            }, 1000);
        }
    }

    componentWillUnmount () {
        window.removeEventListener('message', this.handleParentMessage);
        if (this.vmSyncManager) {
            this.vmSyncManager.disconnect();
        }
    }

    componentDidUpdate (prevProps) {
        // Auto-start when VM becomes available
        if (!showControls && !prevProps.vm && this.props.vm) {
            setTimeout(() => {
                if (this.props.vm) {
                    this.props.vm.start();
                    this.props.vm.greenFlag();
                }
            }, 1000);
        }
    }

    handleVMInitialized (vm) {
        this.vm = vm;
        console.log('[Player] VM initialized');
    }

    handleParentMessage (event) {
        // Handle messages from parent window (room page)
        if (event.data.type === 'START_VM_SYNC') {
            const {roomId, userId, vmServerUrl, token} = event.data;
            console.log('[Player] Received START_VM_SYNC message:', {roomId, userId, vmServerUrl});

            if (this.props.vm) {
                // Initialize VM sync manager
                if (!this.vmSyncManager) {
                    this.vmSyncManager = new VMSyncManager(this.props.vm);
                }

                // Connect to VM server
                this.vmSyncManager.connect(roomId, userId, vmServerUrl, token);
                console.log('[Player] VM sync started');
            } else {
                console.warn('[Player] VM not available yet, cannot start sync');
            }
        }
    }

    render () {
        const {isPlayerOnly, onSeeInside, projectId} = this.props;

        // Generate a username for cloud variables (same logic as render-gui.jsx)
        const username = authManager.isAuthenticated()
            ? authManager.getUser()?.name || authManager.getWalletAddress()?.slice(0, 8) || `player${Math.floor(Math.random() * 10000)}`
            : `guest${Math.floor(Math.random() * 10000)}`;

        return (
            <Box className={classNames(isPlayerOnly ? styles.stageOnly : styles.editor)}>
                <GUI
                    canEditTitle={false}
                    enableCommunity={false}
                    isPlayerOnly={isPlayerOnly}
                    projectId={projectId}
                    showControls={showControls}
                    cloudHost="localhost:9080"
                    username={username}
                    hasCloudPermission={true}
                    canSave={false}
                />
            </Box>
        );
    }
}

Player.propTypes = {
    isPlayerOnly: PropTypes.bool,
    onSeeInside: PropTypes.func,
    onSetFullScreen: PropTypes.func,
    onSetStageSize: PropTypes.func,
    projectId: PropTypes.string,
    vm: PropTypes.object
};

const mapStateToProps = state => ({
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onSeeInside: () => dispatch(setPlayer(false)),
    onSetFullScreen: isFullScreen => dispatch(setFullScreen(isFullScreen)),
    onSetStageSize: stageSize => dispatch(setStageSize(stageSize))
});

const ConnectedPlayer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Player);

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedPlayer = compose(
    AppStateHOC,
    HashParserHOC
)(ConnectedPlayer);

const appTarget = document.createElement('div');
document.body.appendChild(appTarget);

ReactDOM.render(<WrappedPlayer isPlayerOnly />, appTarget);
