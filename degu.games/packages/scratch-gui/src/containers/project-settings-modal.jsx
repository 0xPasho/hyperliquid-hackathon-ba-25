import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import ProjectSettingsModalComponent from '../components/project-settings-modal/project-settings-modal.jsx';
import APIClient from '../lib/api-client';

class ProjectSettingsModal extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleCancel',
            'handlePublish',
            'handleTitleChange',
            'handleDescriptionChange',
            'handleInstructionsChange',
            'handleMultiplayerChange',
            'handleMinPlayersChange',
            'handleMaxPlayersChange',
            'validateAndPublish'
        ]);

        this.state = {
            projectTitle: props.projectTitle || '',
            description: '',
            instructions: '',
            isMultiplayer: null,
            minPlayers: null,
            maxPlayers: null,
            validationErrors: {}
        };
    }

    componentDidUpdate(prevProps) {
        // Update title if it changes in Redux
        if (this.props.projectTitle !== prevProps.projectTitle) {
            this.setState({projectTitle: this.props.projectTitle});
        }
    }

    handleCancel() {
        this.props.onCancel();
    }

    handleTitleChange(e) {
        this.setState({projectTitle: e.target.value});
    }

    handleDescriptionChange(e) {
        this.setState({description: e.target.value});
    }

    handleInstructionsChange(e) {
        this.setState({instructions: e.target.value});
    }

    handleMultiplayerChange(value) {
        this.setState({
            isMultiplayer: value,
            // Reset multiplayer settings if switching to "No"
            ...(value === false && {minPlayers: null, maxPlayers: null})
        });
    }

    handleMinPlayersChange(e) {
        const value = parseInt(e.target.value, 10);
        this.setState({minPlayers: isNaN(value) ? null : value});
    }

    handleMaxPlayersChange(e) {
        const value = parseInt(e.target.value, 10);
        this.setState({maxPlayers: isNaN(value) ? null : value});
    }

    validateAndPublish() {
        const errors = {};
        const {isMultiplayer, minPlayers, maxPlayers} = this.state;

        // Validate multiplayer selection (must be true or false, not null)
        if (isMultiplayer === null) {
            errors.isMultiplayer = 'Please select whether this is a multiplayer game';
        }

        // If multiplayer is enabled, validate player counts
        if (isMultiplayer === true) {
            if (!minPlayers || minPlayers < 2) {
                errors.minPlayers = 'Minimum players must be at least 2';
            }
            if (!maxPlayers || maxPlayers < 2) {
                errors.maxPlayers = 'Maximum players must be at least 2';
            }
            if (minPlayers && maxPlayers && minPlayers > maxPlayers) {
                errors.minPlayers = 'Minimum players cannot be greater than maximum players';
            }
        }

        // If there are validation errors, show them and don't proceed
        if (Object.keys(errors).length > 0) {
            this.setState({validationErrors: errors});
            return;
        }

        // Clear any previous errors
        this.setState({validationErrors: {}});

        // Call the publish handler with the project settings
        this.handlePublish();
    }

    async handlePublish() {
        try {
            const {projectTitle, description, instructions, isMultiplayer, minPlayers, maxPlayers} = this.state;
            const {projectId} = this.props;

            // Update the project with the new settings
            if (projectId) {
                await APIClient.updateProject(projectId, {
                    title: projectTitle,
                    description: description || null,
                    instructions: instructions || null,
                    isMultiplayer,
                    minPlayers: isMultiplayer ? minPlayers : null,
                    maxPlayers: isMultiplayer ? maxPlayers : null,
                    isPublic: true // Set project as public when publishing
                });
            }

            // Call the success callback
            this.props.onPublish({
                projectTitle,
                description,
                instructions,
                isMultiplayer,
                minPlayers: isMultiplayer ? minPlayers : null,
                maxPlayers: isMultiplayer ? maxPlayers : null
            });
        } catch (error) {
            console.error('[ProjectSettingsModal] Failed to publish project:', error);
            this.setState({
                validationErrors: {
                    _general: 'Failed to publish project. Please try again.'
                }
            });
        }
    }

    render() {
        return (
            <ProjectSettingsModalComponent
                isOpen={this.props.isOpen}
                onCancel={this.handleCancel}
                onPublish={this.validateAndPublish}
                projectTitle={this.state.projectTitle}
                description={this.state.description}
                instructions={this.state.instructions}
                isMultiplayer={this.state.isMultiplayer}
                minPlayers={this.state.minPlayers}
                maxPlayers={this.state.maxPlayers}
                onTitleChange={this.handleTitleChange}
                onDescriptionChange={this.handleDescriptionChange}
                onInstructionsChange={this.handleInstructionsChange}
                onMultiplayerChange={this.handleMultiplayerChange}
                onMinPlayersChange={this.handleMinPlayersChange}
                onMaxPlayersChange={this.handleMaxPlayersChange}
                validationErrors={this.state.validationErrors}
            />
        );
    }
}

ProjectSettingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    projectTitle: PropTypes.string,
    projectId: PropTypes.string
};

const mapStateToProps = state => ({
    projectTitle: state.scratchGui.projectTitle,
    projectId: state.scratchGui.projectId
});

const mapDispatchToProps = () => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectSettingsModal);
