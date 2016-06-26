var _AI_LIST_TEMPLATE = ' \
  Your pilots:<br/> \
  <div class="list-group"> \
  {{for ais ~selected=selected}} \
    <a href="javascript: false;" data-id="{{:id}}" class="list-group-item {{if id == ~selected}}active{{/if}}">{{:name}}</a> \
  {{/for}} \
  </div> \
  ';

var AiList = function(container, pick_callback, list_change_callback) {
  this._container = container
  this._template = $.templates(_AI_LIST_TEMPLATE);
  this._context = {
    ais: [],
    selected: undefined
  };
  this._pick_callback = pick_callback;
  this._list_change_callback = list_change_callback || function() {};
};
AiList.prototype._PickAi = function(ai_id) {
  this._context.selected = ai_id;
  this.Render();
  this._GetLogic(ai_id);
};
AiList.prototype._GetLogic = function(ai_id) {
  var loading_popup = new Popup('loading...');
  $.get({
      url: window.location + 'api/get_ai?id=' + ai_id,
      crossDomain: false,
      success: $.proxy(function(response) {
        loading_popup.Destroy();
        this._pick_callback(response.data);
      }, this),
      dataType: 'json'
  }).fail(function(xhr, text_status) {
    loading_popup.Destroy();
    Popup.Spawn('Unable to load ship logic :(', Popup.ERROR, 2000);
  });

};
AiList.prototype.Render = function() {
  this._container.html(this._template.render(this._context));
  var pick_fn = $.proxy(this._PickAi, this);
  $('a', this._container).click(function() {
    pick_fn(this.dataset.id);
  });
};
AiList.prototype.Update = function() {
  $.get({
    url: window.location + 'api/list_ais',
    crossDomain: false,
    success: $.proxy(function(response) {
      var ais = response.data;
      this._context.ais = ais;

      var still_selected = false;
      for (var index in ais) {
        var ai = ais[index];
        still_selected = still_selected || this._context.selected == ai.id;
      }
      if (!still_selected) {
        this._context.selected = undefined;
        this._pick_callback({name: '', logic: ''});
      }
      this._list_change_callback();
      this.Render();
    }, this),
    dataType: 'json'
  }).fail(function(xhr, text_status) {
    Popup.Spawn('Unable to refresh list of AIs :(', Popup.ERROR, 2000);
  });
};
AiList.prototype.GetSelected = function() {
  return this._context.selected;
};


var _EDITOR_SETTINGS = {
  lineNumbers: true,
  mode: 'javascript',
  tabSize: 2,
  matchBrackets: true,
  showTrailingSpace: true
};

var AiEditor = function(container, list_change_callback) {
  this._container = container;
  this._original_data = {name: '', logic: ''}

  this._text_editor = CodeMirror($('div.ai-editor', this._container).get(0),
                                 _EDITOR_SETTINGS);
  this._text_editor.on('changes', $.proxy(this.Render, this));

  this._ai_name_input = $('input.ai-name', this._container).get(0);
  $(this._ai_name_input).keyup($.proxy(this.Render, this));

  this._ai_list = new AiList($('div.ai-list', this._container),
                             $.proxy(this._SetLogic, this),
                             list_change_callback);

  $('input.discard', this._container).click($.proxy(this._DiscardChanges, this));
  $('input.save', this._container).click($.proxy(this._Save, this));
  $('input.delete', this._container).click($.proxy(this._Delete, this));
  $('input.add', this._container).click($.proxy(this._Add, this));
  $('input.new-ai', this._container).keyup($.proxy(this._SetAddButtonState, this)).keyup();

  this._ai_list.Update();
  this.Render();
};
AiEditor.prototype._SetLogic = function(ai_data){
  this._original_data = ai_data
  this._ai_name_input.value = this._original_data.name;
  this._text_editor.setValue(this._original_data.logic);
  this._text_editor.markClean();
  this.Render(); 
};
AiEditor.prototype._Save = function() {
  var new_name = this._ai_name_input.value;
  var new_logic = this._text_editor.getValue();
  var save_popup = new Popup('saving...');
  $.post({
      url: window.location + 'api/save_ai_logic',
      data: {
          id: this._ai_list.GetSelected(),
          name: new_name, 
          logic: new_logic,
          csrfmiddlewaretoken: $.cookie('csrftoken')
      },
      success: $.proxy(function(response) {
        save_popup.Destroy();
        this._SetLogic({name: new_name, logic: new_logic});
        this._ai_list.Update();
      }, this)
  }).fail(function(xhr, text_status) {
    save_popup.Destroy();
    Popup.Spawn('Unable to save AI :(', Popup.ERROR, 2000);
  });
};
AiEditor.prototype._Add = function() {
  var save_popup = new Popup('adding...');
  var ai_name = $('input.new-ai').get(0).value;
  $.post({
      url: window.location + 'api/add_ai',
      data: {
          name: ai_name,
          csrfmiddlewaretoken: $.cookie('csrftoken')
      },
      success: $.proxy(function(response) {
        save_popup.Destroy();
        this._ai_list.Update();
      }, this)
  }).fail(function(xhr, text_status) {
    save_popup.Destroy();
    Popup.Spawn('Unable to add new ship AI :(', Popup.ERROR, 2000);
  });
};
AiEditor.prototype._SetAddButtonState = function() {
  var ai_name_empty = $('input.new-ai').get(0).value == '';
  $('input.add').attr('disabled', ai_name_empty);
};
AiEditor.prototype._Delete = function() {
  if (!window.confirm('Are you sure you want to delete ship AI? This can not be undone.')) {
    return;
  }
  var delete_popup = new Popup('deleting...');
  $.post({
      url: window.location + 'api/delete_ai',
      data: {
          id: this._ai_list.GetSelected(),
          csrfmiddlewaretoken: $.cookie('csrftoken')
      },
      success: $.proxy(function(response) {
        delete_popup.Destroy();
        this._ai_list.Update();
      }, this)
  }).fail(function(xhr, text_status) {
    delete_popup.Destroy();
    Popup.Spawn('Unable to delete AI :(', Popup.ERROR, 2000);
  });
};
AiEditor.prototype._DiscardChanges = function() {
  this._SetLogic(this._original_data);
};
AiEditor.prototype.Render = function() {
  var editor_disabled = this._ai_list.GetSelected() == undefined;
  this._text_editor.setOption('readOnly', editor_disabled);
  $('div.CodeMirror', this._container).toggleClass('disabled', editor_disabled);
  $('input.ai-name').attr('disabled', editor_disabled);
  $('input.delete').attr('disabled', editor_disabled);

  var unchanged = (this._text_editor.isClean() &&
                   this._ai_name_input.value == this._original_data.name);
  var edit_buttons_disabled = editor_disabled || unchanged;
  $('input[type=button]', this._container).not('.delete').not('.add')
      .attr('disabled', edit_buttons_disabled);
};
