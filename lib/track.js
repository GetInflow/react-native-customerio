const Request = require('./request');
const { trackRoot, apiRoot } = require('./common');
const { isEmpty } = require('./utils');

const BROADCASTS_ALLOWED_RECIPIENT_FIELDS = {
  ids: ['ids', 'id_ignore_missing'],
  emails: ['emails', 'email_ignore_missing', 'email_add_duplicates'],
  per_user_data: ['per_user_data', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
  data_file_url: ['data_file_url', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
};

const filterRecipientsDataForField = (recipients, field) => {
  return BROADCASTS_ALLOWED_RECIPIENT_FIELDS[field].reduce((obj, field) => {
    if (!!recipients[field]) {
      obj[field] = recipients[field];
    }
    return obj;
  }, {});
};

class MissingParamError extends Error {
  constructor(param) {
    super(param);
    this.message = `${param} is required`;
  }
}

module.exports = class TrackClient {
  constructor(siteid, apikey, defaults) {
    this.siteid = siteid;
    this.apikey = apikey;
    this.defaults = defaults;
    this.request = new Request({ siteid: this.siteid, apikey: this.apikey }, this.defaults);

    this._trackRoot = defaults && defaults.url ? defaults.url : trackRoot;
    this._apiRoot = defaults && defaults.apiUrl ? defaults.apiUrl : apiRoot;
  }

  identify(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.put(`${this._trackRoot}/customers/${encodeURIComponent(customerId)}`, data);
  }

  destroy(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.destroy(`${this._trackRoot}/customers/${encodeURIComponent(customerId)}`);
  }

  suppress(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this._trackRoot}/customers/${encodeURIComponent(customerId)}/suppress`);
  }

  track(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this._trackRoot}/customers/${encodeURIComponent(customerId)}/events`, data);
  }

  trackPushMetric(data = {}) {
    if (isEmpty(data.device_id)) {
      throw new MissingParamError('data.device_id');
    }
   
    if (isEmpty(data.delivery_id)) {
      throw new MissingParamError('data.delivery_id');
    }
    
    if (isEmpty(data.event)) {
      throw new MissingParamError('data.event');
    }
    
    if (isEmpty(data.timestamp)) {
      throw new MissingParamError('data.timestamp');
    }

    return this.request.post(`${this._trackRoot}/push/events`, data);
  }

  trackAnonymous(data = {}) {
    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this._trackRoot}/events`, data);
  }

  trackPageView(customerId, path) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(path)) {
      throw new MissingParamError('path');
    }

    return this.request.post(`${this._trackRoot}/customers/${encodeURIComponent(customerId)}/events`, {
      type: 'page',
      name: path,
    });
  }

  addDevice(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(data.id)) {
      throw new MissingParamError('data.id');
    }
    
    if (isEmpty(data.platform)) {
      throw new MissingParamError('data.platform');
    }


    return this.request.put(`${this._trackRoot}/customers/${encodeURIComponent(customerId)}/devices`, {
      device: data,
    });
  }

  deleteDevice(customerId, deviceToken) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(deviceToken)) {
      throw new MissingParamError('deviceToken');
    }

    return this.request.destroy(
      `${this._trackRoot}/customers/${encodeURIComponent(customerId)}/devices/${encodeURIComponent(deviceToken)}`,
    );
  }

  triggerBroadcast(id, data, recipients) {
    let payload = {};
    let customRecipientField = Object.keys(BROADCASTS_ALLOWED_RECIPIENT_FIELDS).find((field) => recipients[field]);

    if (customRecipientField) {
      payload = Object.assign({ data }, filterRecipientsDataForField(recipients, customRecipientField));
    } else {
      payload = {
        data,
        recipients,
      };
    }

    return this.request.post(`${this._apiRoot}/api/campaigns/${id}/triggers`, payload);
  }
};
