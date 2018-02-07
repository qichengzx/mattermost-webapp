// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';

import {getFilePreviewUrl, getFileUrl} from 'mattermost-redux/utils/file_utils';

import {FileTypes} from 'utils/constants.jsx';
import {
    getFileType,
    localizeMessage
} from 'utils/utils';

import LoadingImagePreview from 'components/loading_image_preview';
import ViewImageModal from 'components/view_image.jsx';

const PREVIEW_IMAGE_MAX_WIDTH = 1024;
const PREVIEW_IMAGE_MAX_HEIGHT = 350;

export default class SingleImageView extends React.PureComponent {
    static propTypes = {

        /**
         * FileInfo to view
         **/
        fileInfo: PropTypes.object.isRequired
    };

    static defaultProps = {
        fileInfo: {}
    };

    constructor(props) {
        super(props);

        this.state = {
            loaded: false,
            showPreviewModal: false,
            viewPortWidth: 0
        };

        this.imageLoaded = null;
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        this.setViewPortWidth();
        this.loadImage(this.props.fileInfo);
    }

    componentWillReceiveProps(nextProps) {
        window.removeEventListener('resize', this.handleResize);
        this.loadImage(nextProps.fileInfo);
    }

    handleResize = () => {
        this.setViewPortWidth();
    }

    setViewPortRef = (node) => {
        this.viewPort = node;
    }

    setViewPortWidth = () => {
        if (this.viewPort && this.viewPort.getBoundingClientRect) {
            const rect = this.viewPort.getBoundingClientRect();
            this.setState({viewPortWidth: rect.width});
        }
    }

    loadImage = (fileInfo) => {
        const {has_preview_image: hasPreviewImage, id} = fileInfo;
        const fileURL = getFileUrl(id);
        const previewURL = hasPreviewImage ? getFilePreviewUrl(id) : fileURL;

        const loaderImage = new Image();
        loaderImage.src = previewURL;
        loaderImage.onload = () => {
            if (this.imageLoaded) {
                this.imageLoaded.src = previewURL;
            }

            this.setState({loaded: true});
        };
    }

    handleImageClick = (e) => {
        e.preventDefault();
        this.setState({showPreviewModal: true});
    }

    showPreviewModal = () => {
        this.setState({showPreviewModal: false});
    }

    setImageLoadedRef = (node) => {
        this.imageLoaded = node;
    }

    setFileImageRef = (node) => {
        this.fileImage = node;
    }

    computeImageHeight = () => {
        const {fileInfo} = this.props;
        const {viewPortWidth} = this.state;

        let previewHeight = fileInfo.height;

        if (viewPortWidth && fileInfo.width > viewPortWidth) {
            const origRatio = fileInfo.height / fileInfo.width;
            previewHeight = Math.floor(fileInfo.width * origRatio);
        }

        if (previewHeight > PREVIEW_IMAGE_MAX_HEIGHT) {
            const heightRatio = PREVIEW_IMAGE_MAX_HEIGHT / previewHeight;
            previewHeight = PREVIEW_IMAGE_MAX_HEIGHT;
        }

        return previewHeight;
    }

    render() {
        const {fileInfo} = this.props;
        const {loaded} = this.state;

        const previewHeight = this.computeImageHeight();

        const fileHeader = (
            <div className='file-details'>
                <span
                    className='file-details__name'
                    onClick={this.handleImageClick}
                >
                    {fileInfo.name}
                </span>
            </div>
        );

        const fileType = getFileType(fileInfo.extension);
        let svgClass = '';
        if (fileType === FileTypes.SVG) {
            svgClass = 'post-image normal';
        }

        const loading = localizeMessage('view_image.loading', 'Loading');

        let viewImageModal;
        let loadingImagePreview;

        let fadeInClass = '';
        let imageStyle = {height: previewHeight};
        const imageContainerStyle = {height: previewHeight};
        if (loaded) {
            viewImageModal = (
                <ViewImageModal
                    show={this.state.showPreviewModal}
                    onModalDismissed={this.showPreviewModal}
                    fileInfos={[fileInfo]}
                />
            );

            fadeInClass = 'image-fade-in';
            imageStyle = {cursor: 'pointer'};
        } else {
            loadingImagePreview = (
                <LoadingImagePreview
                    loading={loading}
                    containerClass={'file__image-loading'}
                />
            );
        }

        return (
            <div
                ref='singleImageView'
                className={`${'file-view--single'}`}
            >
                <div
                    ref={this.setViewPortRef}
                    className='file__image'
                >
                    {fileHeader}
                    <div
                        className='image-container'
                    >
                        <div
                            className={`image-loaded ${fadeInClass}`}
                            style={imageContainerStyle}
                        >
                            <img
                                ref={this.setImageLoadedRef}
                                style={imageStyle}
                                className={svgClass}
                                onClick={this.handleImageClick}
                            />
                        </div>
                        <div className='image-preload'>
                            {loadingImagePreview}
                        </div>
                    </div>
                    {viewImageModal}
                </div>
            </div>
        );
    }
}
