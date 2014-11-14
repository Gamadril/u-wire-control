/*global define */
define(['lib/stapes', 'views/MainView', 'models/Settings', 'views/SettingsView', 'views/EffectsView', 'data/MicroWire', 'api/USB'], function (Stapes, MainView, Settings, SettingsView, EffectsView, MicroWire, USB) {
    'use strict';

    return Stapes.subclass(/** @lends AppController.prototype */{
        /**
         * @type MainView
         */
        mainView: null,
        /**
         * @type SettingsView
         */
        settingsView: null,
        /**
         * @type EffectsView
         */
        effectsView: null,
        /**
         * @type Settings
         */
        settings: null,
        /**
         * @type MicroWire
         */
        microwire: null,
        color: {
            r: 25,
            g: 25,
            b: 25
        },
        effects: [],
        selectedDevice: null,

        /**
         * @class AppController
         * @constructs
         */
        constructor: function () {
            this.mainView = new MainView();
            this.settingsView = new SettingsView();
            this.effectsView = new EffectsView();

            this.settings = new Settings();

            this.bindEventHandlers();
            this.mainView.setColor(this.color);

            this.effects.push({
                id: 'fade',
                name: 'Color roundtrip'
            });
            this.effects.push({
                id: 'blinkRed',
                name: 'Flashing red'
            });
            this.effects.push({
                id: 'blinkGreen',
                name: 'Flashing green'
            });
            this.effects.push({
                id: 'blinkBlue',
                name: 'Flashing blue'
            });
            this.effectsView.fillList(this.effects);
        },

        /**
         * Do initialization
         */
        init: function () {
            this.settings.load();
        },

        /**
         * @private
         */
        bindEventHandlers: function () {
            this.settings.on({
                'loaded': function () {
                    var i;

                    for (i = 0; i < this.settings.devices.length; i++) {
                        if (this.settings.devices[i].selected) {
                            this.selectedDevice = this.settings.devices[i];
                            break;
                        }
                    }

                    this.settingsView.fillDeviceList(this.settings.devices);

                    if (!this.selectedDevice) {
                        this.gotoArea('settings');
                    } else {
                        this.connectToDevice(this.selectedDevice);
                    }
                },
                'error': function (message) {
                    this.showError(message);
                },
                'deviceAdded': function (device) {
                    var i;
                    for (i = 0; i < this.settings.devices.length; i++) {
                        if (this.settings.devices[i].selected) {
                            this.selectedDevice = this.settings.devices[i];
                            this.connectToDevice(device);
                            break;
                        }
                    }

                    this.settingsView.fillDeviceList(this.settings.devices);
                },
                'deviceChanged': function (device) {
                    var i;
                    for (i = 0; i < this.settings.devices.length; i++) {
                        if (this.settings.devices[i].selected) {
                            this.selectedDevice = this.settings.devices[i];
                            this.connectToDevice(device);
                            break;
                        }
                    }

                    this.settingsView.fillDeviceList(this.settings.devices);
                    this.connectToDevice(device);
                },
                'deviceRemoved': function () {
                    var i, removedSelected = true;
                    this.settingsView.fillDeviceList(this.settings.devices);

                    for (i = 0; i < this.settings.devices.length; i++) {
                        if (this.settings.devices[i].selected) {
                            removedSelected = false;
                            break;
                        }
                    }

                    if (removedSelected) {
                        this.selectedDevice = null;
                        if (this.microwire) {
                            this.microwire.disconnect();
                        }
                    }
                }
            }, this);

            this.mainView.on({
                'barClick': function (id) {
                    if (id !== 'settings') {
                        if (!this.selectedDevice) {
                            this.showError('No device selected');
                        } else if (!this.microwire) {
                            this.connectToDevice(this.selectedDevice);
                        }
                    }
                    this.gotoArea(id);
                },
                'colorChange': function (color) {
                    this.color = color;

                    if (!this.selectedDevice) {
                        this.showError('No device selected');
                    } else if (!this.microwire) {
                        this.connectToDevice(this.selectedDevice);
                    } else {
                        this.microwire.setColor(color);
                    }
                }
            }, this);

            this.settingsView.on({
                'deviceAdded': function (device) {
                    if (device.vid && device.pid) {
                        this.settings.addDevice(device);
                        this.lockSettingsView(false);
                    } else {
                        this.showError('Invalid device data');
                    }
                },
                'deviceAddCanceled': function () {
                    this.lockSettingsView(false);
                    this.settingsView.fillDeviceList(this.settings.devices);
                },
                'deviceEditCanceled': function () {
                    this.lockSettingsView(false);
                    this.settingsView.fillDeviceList(this.settings.devices);
                },
                'deviceSelected': function (index) {
                    this.lockSettingsView(false);
                    this.settings.setSelectedDevice(index);
                    this.connectToDevice(this.settings.devices[index]);
                },
                'deviceRemoved': function (index) {
                    this.settings.removeDevice(index);
                },
                'deviceChanged': function (data) {
                    if (data.device.pid && data.device.vid) {
                        this.settings.updateDevice(data.index, data.device);
                        this.lockSettingsView(false);
                    } else {
                        this.showError('Invalid device data');
                    }
                },
                'editDevice': function (index) {
                    var device = this.settings.devices[index];
                    this.settingsView.editDevice({
                        index: index,
                        device: device
                    });
                },
                'detect': function () {
                    this.lockSettingsView(true);
                    this.settingsView.showWaiting(true);
                    this.searchForDevice(function (device) {
                        this.settings.addDevice(device);
                    }.bind(this), function () {
                        this.lockSettingsView(false);
                        this.settingsView.showWaiting(false);
                    }.bind(this));
                }
            }, this);

            this.effectsView.on({
                'effectSelected': function (index) {
                    if (this.microwire) {
                        this.microwire.runEffect(this.effects[index]);
                    }
                }
            }, this);
        },

        /**
         * @private
         * @param id
         */
        gotoArea: function (id) {
            this.mainView.scrollToArea(id);
        },

        /**
         * @private
         * @param device
         */
        connectToDevice: function (device) {
            if (this.microwire) {
                if (this.microwire.isConnecting()) {
                    return;
                }
                this.microwire.off();
                this.microwire.disconnect();
            }

            this.microwire = new MicroWire(device, USB);
            this.microwire.on({
                connected: function () {
                    this.showStatus('Connected to ' + device.name);
                },
                error: function (message) {
                    this.microwire = null;
                    this.showError(message);
                }
            }, this);
            this.microwire.connect();
        },

        /**
         * Shows the error text
         * @param {string} error - Error message
         */
        showError: function (error) {
            this.mainView.showError(error);
        },

        /**
         * Shows a message
         * @param {string} message - Text to show
         */
        showStatus: function (message) {
            this.mainView.showStatus(message);
        },

        /**
         * @private
         * @param lock
         */
        lockSettingsView: function (lock) {
            if (!this.isBrowser) {
                this.settingsView.enableDetectButton(!lock);
            }
            this.settingsView.lockList(lock);
        },

        /**
         * @private
         * @param onFound
         * @param onEnd
         */
        searchForDevice: function (onFound, onEnd) {
            var lw, device = {
                vid: 0x1781,
                pid: 0x0c9f,
                name: 'u-wire usb'
            };

            lw = new MicroWire(device, USB);
            lw.on('connected', function () {
                onFound(device);
                onEnd();
            }.bind(this));

            lw.on('error', function () {
                onEnd();
            }.bind(this));

            lw.connect();
        }
    });
});
