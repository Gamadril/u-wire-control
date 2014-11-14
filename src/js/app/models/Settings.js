/*global define */
define(['lib/stapes', 'api/LocalStorage'], function (Stapes, LocalStorage) {
    'use strict';

    return Stapes.subclass(/** @lends Settings.prototype */{
        storage: null,
        devices: [],

        /**
         * @class Settings
         * @classdesc Local application settings
         * @constructs
         * @fires saved
         * @fires loaded
         * @fires error
         * @fires deviceAdded
         * @fires deviceChanged
         * @fires deviceRemoved
         */
        constructor: function () {
            this.storage = new LocalStorage();
            this.storage.on({
                error: function (message) {
                    this.emit('error', message);
                },
                got: function (settings) {
                    if (settings) {
                        this.devices = settings.devices || [];
                    }
                    this.emit('loaded');
                },
                set: function () {
                    this.emit('saved');
                }
            }, this);
        },

        /**
         * Save current settings
         */
        save: function () {
            this.storage.set({
                devices: this.devices
            });
        },

        /**
         * Loads persistent settings
         */
        load: function () {
            this.storage.get();
        },

        /**
         * Add a device definition
         * @param {object} device - Device information
         */
        addDevice: function (device) {
            if (this.indexOfDevice(device) === -1) {
                if (this.devices.length === 0) {
                    device.selected = true;
                }

                this.devices.push(device);
                this.save();
                this.emit('deviceAdded', device);
            }
        },

        /**
         * Sets a device as a default device
         * @param {number} index - Index of the device in the list to set as default one
         */
        setSelectedDevice: function (index) {
            var i;
            for (i = 0; i < this.devices.length; i++) {
                delete this.devices[i].selected;
            }
            this.devices[index].selected = true;
            this.save();
            this.emit('deviceChanged', this.devices[index]);
        },

        /**
         * Remove a device from the list
         * @param {number} index - Index of the device in the list to remove
         */
        removeDevice: function (index) {
            this.devices.splice(index, 1);
            this.save();
            this.emit('deviceRemoved');
        },

        /**
         * Update device information
         * @param {number} index - Index of the device to update
         * @param {object} device - New device information
         */
        updateDevice: function (index, device) {
            if (index >= 0 && index < this.devices.length) {
                this.devices[index] = device;
                this.save();
                this.emit('deviceChanged', device);
            }
        },

        /**
         * Find the device in the list.
         * @param {object} device - Device to search index for
         * @returns {number} - Index of the device in the list. -1 if not found
         */
        indexOfDevice: function (device) {
            var i, tmp;

            for (i = 0; i < this.devices.length; i++) {
                tmp = this.device[i];

                if (tmp.vid === device.vid && tmp.pid === device.pid) {
                    return i;
                }
            }

            return -1;
        }

    });
});
