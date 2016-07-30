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
    if (frame.stack) {
      this._log.logMessage(frame.faction, frame.stack, 'error');
    }
    if (frame.outcome == 'ERROR') {
      this._log.logMessage('game', 'Game ended with an error!', 'error');
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

var PanHandler = function(obj, move_callback) {
  this._moveCallback = move_callback;
  this.Reset();

  // TODO(wzoltak): Clean this up.
  $(obj).mousedown($.proxy(function(event) {
    this._startPosition = [event.clientX, event.clientY];
  }, this));
  $(obj).mousemove($.proxy(function(event) {
    if (this._startPosition == null) {
      return false;
    }
    var new_offset = this._GetNewOffset(event);
    this._moveCallback(new_offset[0], new_offset[1]);
    // Disable text selection by cancelling the event.
    return false;
  }, this));
  
  $(obj).mouseout($.proxy(function(event) {
    if (this._startPosition == null) {
      return false;
    }
    this._offset = this._GetNewOffset(event);
    this._startPosition = null;
    return false;
  }, this));
  $(obj).mouseup($.proxy(function(event) {
    if (this._startPosition == null) {
      return false;
    }
    this._offset = this._GetNewOffset(event);
    this._startPosition = null;
  }, this));
};
PanHandler.prototype._GetNewOffset = function(event) {
  var delta_x = event.clientX - this._startPosition[0];
  var delta_y = event.clientY - this._startPosition[1];
  return [this._offset[0] + delta_x, this._offset[1] + delta_y];
};
PanHandler.prototype.Reset = function() {
  this._offset = [0, 0];
  this._startPosition = null;
  this._enabled = false;
};

var Visualization = function(board, log) {
  this._board = board;
  this._canvas = $('canvas.game', board)[0];
  this._renderers = {};
  this._log = log;
  this._zoomFactor = 1;
  this._translation = [0, 0];
  this._lastFrame = null;
  this._backgroundImage = new Image();
  this._backgroundImage.src = '/static/sky.jpg';
  this._resetBtn = $('.reset', board);

  this._pan = new PanHandler(this._canvas, $.proxy(function(x, y) {
    this._translation = [x, y];
    this._resetBtn.attr('disabled', false);
    this.refresh();
  }, this));

  this._resetBtn.click($.proxy(this._resetCoords, this));
  $('.zoom-in', board).click($.proxy(this._zoomIn, this));
  $('.zoom-out', board).click($.proxy(this._zoomOut, this));
  $(this._canvas).bind('mousewheel wheel', $.proxy(function(event) {
    var wheel_delta = event.originalEvent.wheelDelta || event.originalEvent.deltaY * -1; 
    if (wheel_delta > 0) {
      this._zoomIn();
    } else {
      this._zoomOut();
    }
    event.stopPropagation();
    return false;
  }, this));

  this.refresh();
};
Visualization.prototype._resetCoords = function() {
  this._zoomFactor = 1;
  this._translation = [0, 0];
  this._resetBtn.attr('disabled', true);
  this._pan.Reset();
  this.refresh();
}
Visualization.prototype._zoomIn = function() {
  this._zoomFactor *= 1.1;
  this._resetBtn.attr('disabled', false);
  this.refresh();
};
Visualization.prototype._zoomOut = function() {
  this._zoomFactor *= 0.9;
  this._zoomFactor = Math.max(this._zoomFactor, 0.2);
  this._resetBtn.attr('disabled', false);
  this.refresh();
};
Visualization.prototype.refresh = function() {
  var zoom_factor_txt = 'zoom: ' + this._zoomFactor.toFixed(2);
  var offset_txt = 'x: ' + this._translation[0] + ' y:' + this._translation[1];
  $('div.status', this._board).html(zoom_factor_txt + '<br/>' + offset_txt);
  if (this._lastFrame != null) {
    this.renderFrame(this._lastFrame);
  }
};
Visualization.prototype.renderFrame = function(frame) {
  this._lastFrame = frame;
  
  var ctx = this._canvas.getContext("2d");
  var ptrn = ctx.createPattern(this._backgroundImage, 'repeat');
  ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  ctx.fillStyle = ptrn;
  ctx.save();
  ctx.translate(Math.floor(this._canvas.width / 2) + this._translation[0],
                Math.floor(this._canvas.height / 2) + this._translation[1]);
  ctx.scale(0.5 * this._zoomFactor, 0.5 * this._zoomFactor);
  ctx.fillRect(-25000, -25000, 50000, 50000);

  for (var i = 0; i < frame.length; ++i) {
    var object = frame[i];
    ctx.save();
    ctx.translate(object.x, object.y);
    ctx.rotate(object.angle * Math.PI / 180);

    this._renderers[object.typeId](ctx);
    ctx.restore();

    for (var j = 0; j < object.messages.length; ++j) {
      this._log.logMessage(object.faction, object.messages[j]);
    }
  }
  ctx.restore();
};
Visualization.prototype.registerRenderer = function(type_id, renderer) {
  this._renderers[type_id] = renderer;
};
Visualization.prototype.clearCanvas = function() {
  this._lastFrame = null;
  var ctx = this._canvas.getContext("2d");
  ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
};

var shipRenderer = function(ctx) {
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.lineTo(10, -15);
  ctx.lineTo(-10, -15);
  ctx.closePath();
  ctx.fill();
}

var rocketRenderer = function(ctx) {
  ctx.fillStyle = 'red';
  ctx.fillRect(-2, -10, 4, 20);
}

function CreateVisualization(container, log) {
  var viz = new Visualization(container, log);
  viz.registerRenderer('SHIP', shipRenderer);
  viz.registerRenderer('ROCKET', rocketRenderer);
  return viz;
}
