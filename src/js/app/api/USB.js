/*global define */
define(['lib/stapes'], function (Stapes) {
    'use strict';
    return Stapes.subclass(/** @lends USB.prototype */{

        /**
         * @class USB
         * @abstract
         */
        constructor: function () {
        },

        /**
         * Gets the list of available devices
         * @param {object} deviceInfo - Device info object
         * @param {number} deviceInfo.vid - Device vendor id
         * @param {number} deviceInfo.pid - Device product id
         * @param {function} [onSuccess] - Callback to call on success
         * @param {function} [onError] - Callback to call on error
         */
        getDevices: function (deviceInfo, onSuccess, onError) {
        },

        /**
         * Opens a connection to usb device
         * @param {Object} device - Device object
         * @param {function} [onSuccess] - Callback to call on success
         * @param {function} [onError] - Callback to call on error
         * @abstract
         */
        open: function (device, onSuccess, onError) {
        },

        /**
         * Close the current connection
         * @param {function} [onSuccess] - Callback to call on success
         * @abstract
         */
        close: function (onSuccess) {
        },

        /**
         * Read data from the usb device using control transfer
         * @param {object} request - Request object.
         * @param {function} [onSuccess] - Callback to call on success
         * @param {function} [onError] - Callback to call on error
         * @abstract
         */
        control_read: function (request, onSuccess, onError) {
        },

        /**
         * Writes data to the usb device using control transfer
         * @param {object} request - Request object.
         * @param {function} [onSuccess] - Callback to call if data was sent successfully
         * @param {function} [onError] - Callback to call on error
         * @abstract
         */
        control_write: function (request, onSuccess, onError) {
        }
    }, true);
});
