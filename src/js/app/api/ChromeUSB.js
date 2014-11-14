/*global chrome */
define(['lib/stapes', 'api/USB'], function (Stapes, USB) {
    'use strict';
    return USB.subclass(/** @lends ChromeUSB.prototype  */{
        DEBUG: true,

        handle: null,

        /**
         * @class ChromeUSB
         * @extends USB
         * @constructs
         */
        constructor: function () {
        },

        getDevices: function (deviceInfo, onSuccess, onError) {
            if (this.DEBUG) {
                console.log('Trying to get device VID: 0x' + deviceInfo.vid.toString(16) + ' PID: 0x' + deviceInfo.pid.toString(16));
            }
            chrome.usb.getDevices({
                "vendorId": deviceInfo.vid,
                "productId": deviceInfo.pid
            }, function (devices) {
                if (this.DEBUG) {
                    console.log('Got ' + devices.length + ' devices');
                }

                if (devices && devices.length > 0) {
                    if (onSuccess) {
                        onSuccess(devices);
                    }
                } else if (onError) {
                    if (this.DEBUG) {
                        console.log('[ERROR] Could not get device');
                    }
                    onError('Could not find device');
                }
            }.bind(this));
        },

        open: function (device, onSuccess, onError) {
            if (this.DEBUG) {
                console.log('Trying to open device %O', device);
            }
            chrome.usb.openDevice(device, function (connection) {
                if (connection) {
                    if (this.DEBUG) {
                        console.log('Device opened %O', device);
                    }
                    this.handle = connection;
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    if (this.DEBUG) {
                        console.log('[ERROR] Could not open device: ' + chrome.runtime.lastError.message);
                    }
                    if (onError) {
                        onError(chrome.runtime.lastError.message);
                    }
                }
            }.bind(this));
        },

        close: function (onSuccess) {
            if (this.handle) {
                chrome.usb.closeDevice(this.handle, function () {
                    if (this.DEBUG) {
                        console.log('Device closed');
                    }
                    this.handle = null;
                    if (onSuccess) {
                        onSuccess();
                    }
                }.bind(this));
            }
        },

        control_read: function (request, onSuccess, onError) {
            if (this.handle) {
                chrome.usb.controlTransfer(this.handle, request, function (result) {
                    var data;

                    if (chrome.runtime.lastError && onError) {
                        if (this.DEBUG) {
                            console.log('[ERROR] control_read failed: ' + chrome.runtime.lastError.message);
                        }
                        onError(chrome.runtime.lastError.message);
                    } else if (onSuccess) {
                        data = new Uint8Array(result);
                        if (this.DEBUG) {
                            console.log('control_read: %O', data);
                        }
                        onSuccess(data);
                    }
                }.bind(this));
            } else {
                if (this.DEBUG) {
                    console.log('[ERROR] control_read: Invalid handle');
                }
                if (onError) {
                    onError('Invalid handle');
                }
            }
        },

        control_write: function (request, onSuccess, onError) {
            if (this.DEBUG) {
                console.log('control_write: %O', request);
            }
            if (this.handle) {
                chrome.usb.controlTransfer(this.handle, request, function (result) {
                    if (chrome.runtime.lastError && onError) {
                        if (this.DEBUG) {
                            console.log('[ERROR] control_write failed: ' + chrome.runtime.lastError.message);
                        }
                        onError(chrome.runtime.lastError.message);
                    } else if (onSuccess) {
                        onSuccess();
                    }
                }.bind(this));
            } else {
                if (this.DEBUG) {
                    console.log('[ERROR] control_write: Invalid handle');
                }
                if (onError) {
                    onError('Invalid handle');
                }
            }
        }
    }, true);
});
