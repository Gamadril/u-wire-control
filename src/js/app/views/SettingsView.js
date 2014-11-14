define(['lib/stapes', 'views/DeviceList'], function (Stapes, DeviceList) {
    'use strict';

    function createLabelInputLine (params) {
        var dom, el;

        dom = document.createElement('div');
        dom.classList.add('inputline');
        dom.id = params.id;

        el = document.createElement('label');
        el.innerHTML = params.label;
        dom.appendChild(el);

        el = document.createElement('input');
        if (typeof params.value === 'number') {
            el.type = 'number';
        }
        el.value = params.value || '';
        el.autocomplete = 'off';
        el.autocorrect = 'off';
        el.autocapitalize = 'off';
        dom.appendChild(el);

        return dom;
    }

    function createButtonLine (params) {
        var dom, el;

        dom = document.createElement('div');
        dom.classList.add('inputline');

        el = document.createElement('button');
        el.innerHTML = params.label;
        el.classList.add('OK');
        dom.appendChild(el);

        el = document.createElement('button');
        el.innerHTML = 'Cancel';
        el.classList.add('CANCEL');
        dom.appendChild(el);

        return dom;
    }

    function createDetectLine () {
        var dom, el;

        dom = document.createElement('div');
        dom.classList.add('line');

        el = document.createElement('button');
        el.id = 'detect_button';
        el.innerHTML = 'Detect';
        dom.appendChild(el);

        el = document.createElement('div');
        el.classList.add('spinner');
        el.classList.add('hidden');
        dom.appendChild(el);

        return dom;
    }

    return Stapes.subclass(/** @lends SettingsView.prototype */{
        dom: null,
        deviceList: null,

        /**
         * @class SettingsView
         * @classdesc View for the settings
         * @constructs
         */
        constructor: function () {
            var list = [], el;

            this.dom = document.querySelector('#settings');

            this.deviceList = new DeviceList({
                id: 'deviceList',
                label: 'USB Device',
                list: list
            });

            this.deviceList.on({
                add: function () {
                    var line, box;

                    this.enableDetectButton(false);
                    this.lockList(true);

                    box = document.createDocumentFragment();

                    line = createLabelInputLine({
                        id: 'name',
                        label: 'Name:'
                    });
                    box.appendChild(line);
                    line = createLabelInputLine({
                        id: 'vid',
                        label: 'Vendor ID:'
                    });
                    box.appendChild(line);
                    line = createLabelInputLine({
                        id: 'pid',
                        label: 'Product ID:'
                    });
                    box.appendChild(line);

                    line = createButtonLine({label: 'Add'});

                    window.addClickHandler(line.firstChild, function (event) {
                        var device = {}, i, inputs = event.target.parentNode.parentNode.querySelectorAll('input');

                        for (i = 0; i < inputs.length; i++) {
                            device[inputs[i].parentNode.id] = inputs[i].value;
                        }

                        device.vid = parseInt(device.vid);
                        device.pid = parseInt(device.pid);

                        this.emit('deviceAdded', device);
                    }.bind(this));

                    window.addClickHandler(line.lastChild, function () {
                        this.emit('deviceAddCanceled');
                    }.bind(this));
                    box.appendChild(line);
                    this.deviceList.append(null, false, box);
                },
                select: function (id) {
                    if (!this.dom.classList.contains('locked')) {
                        this.emit('deviceSelected', parseInt(id.replace('device_', '')));
                    }
                },
                remove: function (id) {
                    this.emit('deviceRemoved', parseInt(id.replace('device_', '')));
                },
                edit: function (id) {
                    this.emit('editDevice', parseInt(id.replace('device_', '')));
                }
            }, this);

            this.dom.appendChild(this.deviceList.getDom());

            el = createDetectLine();

            window.addClickHandler(el.querySelector('button'), function () {
                this.emit('detect');
            }.bind(this));

            this.dom.appendChild(el);
        },

        /**
         * Fills the list of known devices
         * @param {Array} devices - list of devices
         */
        fillDeviceList: function (devices) {
            var i, device, params;
            this.deviceList.clear();
            for (i = 0; i < devices.length; i++) {
                device = devices[i];
                params = {
                    id: 'device_' + i,
                    title: device.name,
                    subtitle: '0x' + device.vid.toString(16) + ':0x' + device.pid.toString(16)
                };
                if (device.selected) {
                    params.selected = true;
                }
                this.deviceList.addLine(params);
            }
            this.deviceList.showAddButton(true);
        },

        /**
         * Shows or hides the spinner as progress indicator
         * @param {boolean} show - True to show, false to hide
         */
        showWaiting: function (show) {
            if (show) {
                this.dom.querySelector('.spinner').classList.remove('hidden');
            } else {
                this.dom.querySelector('.spinner').classList.add('hidden');
            }
        },

        /**
         * Enables or disables the detect button
         * @param {Boolean} enabled - True to enable, false to disable
         */
        enableDetectButton: function (enabled) {
            if (enabled) {
                this.dom.querySelector('#detect_button').classList.remove('hidden');
            } else {
                this.dom.querySelector('#detect_button').classList.add('hidden');
            }
        },

        /**
         * Locks the list for editing/deleting
         * @param {Boolean} lock - True to lock, false to unlock
         */
        lockList: function (lock) {
            if (!lock) {
                this.dom.classList.remove('locked');
                this.deviceList.showAddButton(true);
            } else {
                this.dom.classList.add('locked');
                this.deviceList.showAddButton(false);
            }
        },

        editDevice: function (deviceInfo) {
            var line, box;

            this.lockList(true);
            this.enableDetectButton(false);

            box = document.createDocumentFragment();

            line = createLabelInputLine({
                id: 'name',
                label: 'Name:',
                value: deviceInfo.device.name
            });
            box.appendChild(line);
            line = createLabelInputLine({
                id: 'vid',
                label: 'Vendor ID:',
                value: deviceInfo.device.vid
            });
            box.appendChild(line);
            line = createLabelInputLine({
                id: 'pid',
                label: 'Product ID:',
                value: deviceInfo.device.pid
            });
            box.appendChild(line);
            line = createButtonLine({label: 'Done'});

            window.addClickHandler(line.querySelector('button.OK'), function (event) {
                var device = {}, i, inputs = event.target.parentNode.parentNode.querySelectorAll('input');

                for (i = 0; i < inputs.length; i++) {
                    device[inputs[i].parentNode.id] = inputs[i].value;
                }

                device.vid = parseInt(device.vid);
                device.pid = parseInt(device.pid);
                if (deviceInfo.selected) {
                    device.selected = true;
                }

                this.emit('deviceChanged', {
                    index: deviceInfo.index,
                    device: device
                });
            }.bind(this));

            window.addClickHandler(line.querySelector('button.CANCEL'), function () {
                this.emit('deviceEditCanceled');
            }.bind(this));
            box.appendChild(line);

            window.addClickHandler(box.querySelector('input'), function (event) {
                event.stopPropagation();
            });

            this.deviceList.replace(deviceInfo.index, box);
        }
    });
});

