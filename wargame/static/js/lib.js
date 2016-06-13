var Popup = function(text, type) {
  type = type || Popup.INFO;
  this._body = $('<div class="popup ' +  type + '">' + text + '</div>');
  $(Popup._CONTAINER_SELECTOR).append(this._body);
  this._body.fadeIn(200);
};
Popup.prototype.Destroy = function(time_ms) {
  if (this._body) {
    this._body.fadeOut(200, $.proxy(this._body.remove, this._body));
    this._body = null;
  }
};
Popup.prototype.DestroyIn = function(time_ms) {
  var that = this;
  setTimeout($.proxy(this.Destroy, this), time_ms);
};
Popup.Spawn = function(text, type, lifetime_ms) {
  var popup = new Popup(text, type);
  popup.DestroyIn(lifetime_ms);
}
Popup._CONTAINER_SELECTOR = 'div#popups';
Popup.INFO = 'info';
Popup.ERROR = 'error';


