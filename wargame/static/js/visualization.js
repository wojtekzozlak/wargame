var FRAME_DURATION_MS = 20;

var Controls = function(container, visualization, log) {
  this._container = container;
  this._visualization = visualization;
  this._log = log;
  this._timer_id = null;

  this._play_btn = $('.play', this._container);
  this._pause_btn = $('.pause', this._container);
  this._stop_btn = $('.stop', this._container);
  this._player_btns = $('input[type=button]', this._container);
  this._player_btns.prop('disabled', true);
  this._play_btn.click($.proxy(this.play, this));
  this._pause_btn.hide().click($.proxy(this.pause, this));
  this._stop_btn.click($.proxy(this.stop, this));

  this.setFrames([]);
};
Controls.prototype.setFrames = function(frames) {
  if (frames.length > 0) {
    this._player_btns.prop('disabled', false);
  }
  this._frames = frames;
  this.stop();
};
Controls.prototype.play = function(frames) {
  if (this._timer_id != null) {
    return;
  }
  if (this._frames.length == this._frame) {
    this.stop();
  }

  this._play_btn.hide();
  this._pause_btn.show();
  this._timer_id = setInterval($.proxy(this._drawFrame, this), FRAME_DURATION_MS);
};
Controls.prototype._drawFrame = function() {
  if (this._frame == this._frames.length) {
    this.pause();
    return;
  }
  this._log.setTime(this._frame * FRAME_DURATION_MS);
  var frame = this._frames[this._frame];
  if (frame.type == 'FRAME') {
    this._visualization.renderFrame(frame.contents);
  } else if (frame.type == 'OUTCOME') {
    if (frame.outcome == 'ERROR') {
      this._log.logMessage(frame.faction, frame.stack, 'error');
    } else if (frame.outcome == 'WINNER') {
      this._log.logMessage('game', frame.faction + ' won the game!', 'error');
    } else if (frame.outcome == 'TIE') {
      this._log.logMessage('game', 'Game ended with a tie!', 'error');
    }
  }
  this._frame++;
};
Controls.prototype.pause = function() {
  clearTimeout(this._timer_id);
  this._timer_id = null;
  this._play_btn.show();
  this._pause_btn.hide();
};
Controls.prototype.stop = function() {
  this.pause();
  this.rewind(0);
  this._log.clear();
  this._visualization.clearCanvas();
};
Controls.prototype.rewind = function(frame) {
  frame = Math.min(this._frames.length - 1, frame);
  this._frame = frame;
};


var _LOG_ENTRY_TEMPLATE = '\
  <li class="{{:severity}}"> \
    <span class="time">{{:time}}s</span> \
    <span class="source">[{{:source}}]:</span> <span class="msg">{{:msg}}</span> \
  </li> \
';

var Log = function(container) {
  this._container = container;
  this._timer = $('.timer', container);
  this._events = $('.events', container);
  this._entry_template = $.templates(_LOG_ENTRY_TEMPLATE);
  this.clear();
};
Log.prototype.clear = function() {
  this._events.html('');
  this.setTime(0);
}
Log.prototype.setTime = function(time) {
  this._time = time / 1000
  this._timer.html(this._time + 's');
};
Log.prototype.logMessage = function(source, msg, severity) {
  severity = severity || 'info';
  var new_msg = this._entry_template.render({
    severity: severity,
    time: this._time,
    source: source,
    msg: msg
  });
  this._events.append(new_msg);
  this._events.scrollTop(this._events[0].scrollHeight);
};


var PlayersPicker = function(container, viz_controls) {
  this._container = container;
  this._viz_controls = viz_controls;

  this._player_a = $('.player-a', this._container);
  this._player_b = $('.player-b', this._container);
  this._ais_list = [];
  this._compile_btn = $('.compile', this._container);
  this._compile_btn.click($.proxy(this._RunMatch, this));
};
PlayersPicker.prototype._RunMatch = function() {
  var processing_popup = new Popup('Processing...');
  $.post({
    url: window.location + 'api/run_match',
    crossDomain: false,
    data: {
      player_a: this._player_a.val(),
      player_b: this._player_b.val(),
      csrfmiddlewaretoken: $.cookie('csrftoken')
    },
    success: $.proxy(function(response) {
      processing_popup.Destroy();
      frames = response.data;
      this._viz_controls.setFrames(response.data);
      this._viz_controls.play();
    }, this)
  }).fail(function(xhr, text_status) {
    processing_popup.Destroy();
    Popup.Spawn('Error while running match :(', Popup.ERROR, 2000);
  });
};
PlayersPicker.prototype.Refresh = function() {
  $.get({
    url: window.location + 'api/list_ais',
    crossDomain: false,
    success: $.proxy(function(response) {
      this._ais_list = response.data;
      this.Render();
    }, this),
    dataType: 'json'
  }).fail(function(xhr, text_status) {
    loading_popup.Destroy();
    Popup.Spawn('Unable to refresh list of AIs :(', Popup.ERROR, 2000);
  });
};
PlayersPicker.prototype.Render = function() {
  var player_a_selection = this._player_a.val();
  var player_b_selection = this._player_b.val();
  this._UpdateSelect(this._player_a, player_a_selection);
  this._UpdateSelect(this._player_b, player_b_selection);
};
PlayersPicker.prototype._UpdateSelect = function(ai_select, selected) {
  ai_select.empty();
  $.each(this._ais_list, $.proxy(function(index, ai) {
    var option = $('<option></option>').attr('value', ai.id).text(ai.name);
    if (ai.id == selected) {
      option.attr('selected', true);
    }
    ai_select.append(option.clone());
  }, this));
}
