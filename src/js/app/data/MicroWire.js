/*global define */
define(['lib/stapes', 'lib/tinycolor'], function (Stapes, Tinycolor) {
    'use strict';

    return Stapes.subclass(/** @lends MicroWire.prototype */{
        /** @type USB */
        usb: null,
        deviceInfo: null,
        connecting: false,
        busy: false,
        effectTimer: undefined,

        LED: 1, // LED is connected to pin 1

        /**
         * @class MicroWire
         * @classdesc Communication interface for a µ-wire usb device
         * @constructs
         * @param {object} deviceInfo - Device info object
         * @param {number} deviceInfo.vid - Device vendor id
         * @param {number} deviceInfo.pid - Device product id
         * @param {function} USB - constructor of the usb interface to use for communication
         *
         * @fires connected
         * @fires error
         * @fires version
         * @fires cmdSent
         */
        constructor: function (deviceInfo, USB) {
            this.deviceInfo = deviceInfo;
            this.usb = new USB();
        },

        /**
         * Try to connect to the device
         */
        connect: function () {
            if (!this.deviceInfo) {
                this.emit('error', 'Missing device info');
            } else {
                this.connecting = true;

                this.usb.getDevices(this.deviceInfo, function (devices) {
                    if (devices && devices.length > 0) {
                        this.usb.open(devices[0], function () {
                            this.connecting = false;
                            this.emit('connected');
                        }.bind(this), function (error) {
                            this.connecting = false;
                            this.emit('error', error);
                        }.bind(this));
                    } else {
                        this.connecting = false;
                        this.emit('error', 'Could not find any devices');
                    }
                }.bind(this), function (error) {
                    this.emit('error', error);
                }.bind(this));
            }
        },

        /**
         * Disconnect from the device
         */
        disconnect: function () {
            this.usb.close();
        },

        /**
         * Reads the firmware version fo the µ-wire device
         */
        readFirmwareVersion: function () {
            this.usb.control_read({
                requestType: 'vendor',
                recipient: 'endpoint',
                direction: 'in',
                request: 34,
                value: 0,
                index: 0,
                length: 8
            }, function (result) {
                this.emit('version', result);
            }.bind(this), function (error) {
                this.emit('error', error);
            }.bind(this));
        },

        /**
         * Sends the color command to the server
         * @param {object} color - Color to set
         * @param {number} color.r - Red value
         * @param {number} color.g - Green value
         * @param {number} color.b - Blue value
         */
        setColor: function (color) {
            var r, g, b;

            r = Math.floor(color.r);
            g = Math.floor(color.g);
            b = Math.floor(color.b);

            if (this.connecting || this.busy) {
                return;
            }

            if (this.effectTimer) {
                clearTimeout(this.effectTimer);
            }

            this.busy = true;
            this.usb.control_write({
                requestType: 'vendor',
                recipient: 'endpoint',
                direction: 'out',
                request: 54,
                value: (g << 8) | this.LED | 0x30,
                index: (b << 8) | r,
                data: new Uint8Array([]).buffer
            }, function () {
                this.busy = false;
                this.emit('cmdSent');
            }.bind(this), function (error) {
                this.busy = false;
                this.emit('error', error);
            }.bind(this));
        },

        /**
         * Sends a command to rund specified effect
         * @param {object} effect - Effect object
         */
        runEffect: function (effect) {
            var off, h = 0, s = 255, v = 255, color;

            var blink = function (color) {
                if (off) {
                    this.setColor({
                        r: 0,
                        g: 0,
                        b: 0
                    });
                    off = false;
                } else {
                    this.setColor(color);
                    off = true
                }

                this.effectTimer = setTimeout(function () {
                    blink(color);
                }, 1000);
            }.bind(this);

            var setNextColor = function () {
                if (h == 359)
                    h = 0; else
                    h += 1;

                color = new Tinycolor({
                    h: h,
                    s: s,
                    v: v
                });

                this.setColor(color.toRgb());

                this.effectTimer = setTimeout(setNextColor, 20);
            }.bind(this);

            if (this.effectTimer) {
                clearTimeout(this.effectTimer);
            }

            if (effect.id === 'fade') {
                setNextColor();
            } else if (effect.id === 'blinkRed') {
                blink(new Tinycolor('red').toRgb());
            } else if (effect.id === 'blinkGreen') {
                blink(new Tinycolor('green').toRgb());
            } else if (effect.id === 'blinkBlue') {
                blink(new Tinycolor('blue').toRgb());
            }
        },

        isConnecting: function () {
            return this.connecting;
        }
    });
});
