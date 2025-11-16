import PropTypes from 'prop-types';
import React from 'react';
import ReactModal from 'react-modal';
import Box from '../box/box.jsx';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';

import styles from './project-settings-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Project Settings',
        description: 'Title for project settings modal',
        id: 'gui.projectSettings.title'
    },
    projectTitle: {
        defaultMessage: 'Project Title',
        description: 'Label for project title input',
        id: 'gui.projectSettings.projectTitle'
    },
    description: {
        defaultMessage: 'Description',
        description: 'Label for project description',
        id: 'gui.projectSettings.description'
    },
    instructions: {
        defaultMessage: 'Instructions',
        description: 'Label for project instructions',
        id: 'gui.projectSettings.instructions'
    },
    multiplayer: {
        defaultMessage: 'Is this a multiplayer game?',
        description: 'Label for multiplayer setting',
        id: 'gui.projectSettings.multiplayer'
    },
    yes: {
        defaultMessage: 'Yes',
        description: 'Yes option',
        id: 'gui.projectSettings.yes'
    },
    no: {
        defaultMessage: 'No',
        description: 'No option',
        id: 'gui.projectSettings.no'
    },
    minPlayers: {
        defaultMessage: 'Minimum Players',
        description: 'Label for minimum players input',
        id: 'gui.projectSettings.minPlayers'
    },
    maxPlayers: {
        defaultMessage: 'Maximum Players',
        description: 'Label for maximum players input',
        id: 'gui.projectSettings.maxPlayers'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Cancel button',
        id: 'gui.projectSettings.cancel'
    },
    publish: {
        defaultMessage: 'Publish',
        description: 'Publish button',
        id: 'gui.projectSettings.publish'
    }
});

const ProjectSettingsModal = props => {
    const {
        intl,
        isOpen,
        onCancel,
        onPublish,
        projectTitle,
        description,
        instructions,
        isMultiplayer,
        minPlayers,
        maxPlayers,
        onTitleChange,
        onDescriptionChange,
        onInstructionsChange,
        onMultiplayerChange,
        onMinPlayersChange,
        onMaxPlayersChange,
        validationErrors
    } = props;

    return (
        <ReactModal
            isOpen={isOpen}
            className={styles.modalContent}
            overlayClassName={styles.modalOverlay}
            onRequestClose={onCancel}
            contentLabel={intl.formatMessage(messages.title)}
        >
            <Box className={styles.body}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        {intl.formatMessage(messages.title)}
                    </div>
                </div>

                <div className={styles.content}>
                    {/* Project Title */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {intl.formatMessage(messages.projectTitle)}
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            value={projectTitle}
                            onChange={onTitleChange}
                            placeholder="Enter project title"
                        />
                    </div>

                    {/* Description */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {intl.formatMessage(messages.description)}
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={onDescriptionChange}
                            placeholder="Describe your project"
                            rows={3}
                        />
                    </div>

                    {/* Instructions */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {intl.formatMessage(messages.instructions)}
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={instructions}
                            onChange={onInstructionsChange}
                            placeholder="How to use your project"
                            rows={3}
                        />
                    </div>

                    {/* Multiplayer Selection */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {intl.formatMessage(messages.multiplayer)}
                            <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="multiplayer"
                                    checked={isMultiplayer === true}
                                    onChange={() => onMultiplayerChange(true)}
                                />
                                <span>{intl.formatMessage(messages.yes)}</span>
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="multiplayer"
                                    checked={isMultiplayer === false}
                                    onChange={() => onMultiplayerChange(false)}
                                />
                                <span>{intl.formatMessage(messages.no)}</span>
                            </label>
                        </div>
                        {validationErrors.isMultiplayer && (
                            <div className={styles.error}>{validationErrors.isMultiplayer}</div>
                        )}
                    </div>

                    {/* Multiplayer Settings - Only show if Yes is selected */}
                    {isMultiplayer === true && (
                        <div className={styles.multiplayerSettings}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    {intl.formatMessage(messages.minPlayers)}
                                    <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    min="2"
                                    value={minPlayers || ''}
                                    onChange={onMinPlayersChange}
                                    placeholder="e.g. 2"
                                />
                                {validationErrors.minPlayers && (
                                    <div className={styles.error}>{validationErrors.minPlayers}</div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    {intl.formatMessage(messages.maxPlayers)}
                                    <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    min="2"
                                    value={maxPlayers || ''}
                                    onChange={onMaxPlayersChange}
                                    placeholder="e.g. 8"
                                />
                                {validationErrors.maxPlayers && (
                                    <div className={styles.error}>{validationErrors.maxPlayers}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.cancelButton}
                        onClick={onCancel}
                    >
                        {intl.formatMessage(messages.cancel)}
                    </button>
                    <button
                        className={styles.publishButton}
                        onClick={onPublish}
                    >
                        {intl.formatMessage(messages.publish)}
                    </button>
                </div>
            </Box>
        </ReactModal>
    );
};

ProjectSettingsModal.propTypes = {
    intl: intlShape.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    projectTitle: PropTypes.string,
    description: PropTypes.string,
    instructions: PropTypes.string,
    isMultiplayer: PropTypes.bool,
    minPlayers: PropTypes.number,
    maxPlayers: PropTypes.number,
    onTitleChange: PropTypes.func.isRequired,
    onDescriptionChange: PropTypes.func.isRequired,
    onInstructionsChange: PropTypes.func.isRequired,
    onMultiplayerChange: PropTypes.func.isRequired,
    onMinPlayersChange: PropTypes.func.isRequired,
    onMaxPlayersChange: PropTypes.func.isRequired,
    validationErrors: PropTypes.object
};

ProjectSettingsModal.defaultProps = {
    projectTitle: '',
    description: '',
    instructions: '',
    isMultiplayer: null,
    minPlayers: null,
    maxPlayers: null,
    validationErrors: {}
};

export default injectIntl(ProjectSettingsModal);
