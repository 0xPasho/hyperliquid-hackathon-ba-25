import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {
    defaultProjectId,
    getIsFetchingWithoutId,
    setProjectId
} from '../reducers/project-state';
import APIClient from './api-client';
import log from './log';

/* Higher Order Component to get the project id from location.hash
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with hash parsing behavior
 */
const HashParserHOC = function (WrappedComponent) {
    class HashParserComponent extends React.Component {
        constructor (props) {
            super(props);
            this.state = {
                showError: false,
                errorMessage: ''
            };
            bindAll(this, [
                'handleHashChange',
                'showMissingProjectIdError'
            ]);
        }
        componentDidMount () {
            window.addEventListener('hashchange', this.handleHashChange);
            this.handleHashChange();
        }
        showMissingProjectIdError () {
            log.error('❌ No project ID provided in URL');
            // Set a special error state to show error message
            this.setState({showError: true, errorMessage: 'No project ID provided. Please access the editor from a valid project page.'});
        }
        componentDidUpdate (prevProps) {
            // if we are newly fetching a non-hash project...
            if (this.props.isFetchingWithoutId && !prevProps.isFetchingWithoutId) {
                // ...clear the hash from the url
                history.pushState('new-project', 'new-project',
                    window.location.pathname + window.location.search);
            }
        }
        componentWillUnmount () {
            window.removeEventListener('hashchange', this.handleHashChange);
        }
        handleHashChange () {
            // Support both numeric IDs and CUIDs (e.g., #123 or #cmgk3kz980000xc9wnraqp9gt)
            const hashMatch = window.location.hash.match(/#([a-zA-Z0-9]+)/);

            if (hashMatch === null || hashMatch[1] === '') {
                // No project ID in URL - show error instead of creating a new project
                this.showMissingProjectIdError();
            } else {
                // Project ID found in URL - use it
                const hashProjectId = hashMatch[1];
                log.info(`🔗 Found project ID in URL hash: ${hashProjectId}`);
                this.props.setProjectId(hashProjectId.toString());
                // Clear any previous error
                this.setState({showError: false, errorMessage: ''});
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                isFetchingWithoutId: isFetchingWithoutIdProp,
                reduxProjectId,
                setProjectId: setProjectIdProp,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;

            // If there's an error, show error message instead of editor
            if (this.state.showError) {
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        backgroundColor: '#1e1e1e',
                        color: '#ffffff',
                        fontFamily: 'Arial, sans-serif',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            maxWidth: '600px',
                            padding: '40px',
                            backgroundColor: '#2d2d2d',
                            borderRadius: '8px',
                            border: '1px solid #404040'
                        }}>
                            <h1 style={{
                                fontSize: '24px',
                                marginBottom: '16px',
                                color: '#ff4444'
                            }}>
                                ⚠️ Invalid Route
                            </h1>
                            <p style={{
                                fontSize: '16px',
                                lineHeight: '1.5',
                                color: '#cccccc',
                                marginBottom: '24px'
                            }}>
                                {this.state.errorMessage}
                            </p>
                            <p style={{
                                fontSize: '14px',
                                color: '#888888'
                            }}>
                                Games are created from the project page. Please navigate to a valid project to access the editor.
                            </p>
                            <button
                                onClick={() => window.location.href = process.env.SITE_URL || '/'}
                                style={{
                                    marginTop: '24px',
                                    padding: '12px 24px',
                                    backgroundColor: '#007AFF',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }
    HashParserComponent.propTypes = {
        isFetchingWithoutId: PropTypes.bool,
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func
    };
    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            isFetchingWithoutId: getIsFetchingWithoutId(loadingState),
            reduxProjectId: state.scratchGui.projectState.projectId
        };
    };
    const mapDispatchToProps = dispatch => ({
        setProjectId: projectId => {
            dispatch(setProjectId(projectId));
        }
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(HashParserComponent);
};

export {
    HashParserHOC as default
};
