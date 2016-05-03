var divRules = $('#div-rules'), outputGen=$('#outputGen'), currentRule, currentTab, allSubList = [], lastSub, MAX_LENGTH = 100;

var addNewSubrule = function() {
	currentRule.addSubrule("");
};

var isString = function(obj) {
	return (typeof obj === 'string' || obj instanceof String);
};

var insert = function(str, position, substr) {
	return [str.slice(0, position), substr, str.slice(position)].join('');
};


function Subrule(parRule, text) {
	var me = this;

	this.parRule = parRule;
	this.components = [];

	// Append New Subrule
		this.inputGroup = $('<div>', {class:"input-group"});	
		this.inputGroup.appendTo('#div-' + parRule.id + '-subrules');
		
		this.span = $('<span>', {class:"input-group-btn"});
			this.button = $('<span>', {class:"btn glyphicon glyphicon-remove"});
				this.button.attr("aria-hidden","true");
			this.button.appendTo(this.span);
			this.button.mouseup( function() {me.destroy();} );
		this.span.appendTo(this.inputGroup);
		
		this.input = $('<input>', {type:"text", class:"form-control", placeholder:"\u03B5", value:text});
		this.input.focus( function() {lastSub = me;} );
		this.input.keydown( function(event) {me.key(event);} );
		this.input.keypress( function(event) {me.keyNull(event);} );
		this.input.keyup( function(event) {me.keyNull(event);} );
		
		this.input.appendTo(this.inputGroup);
}
	Subrule.prototype.keyNull = function(event) {
		event.preventDefault();
	};
	Subrule.prototype.key = function(event) {
		event.preventDefault();
		
		//alert(event.which);
		
		var start, end, code = event.which;
		start = this.input.range().start;
		end = this.input.range().end;
		
		//alert(start);
	
		//Backspace
		if(code == 8) {
			if(start == end)
				this.erase(start-1,end);
			else
				this.erase(start,end);
		}
		
		// Delete
		else if(code == 46) {
			if(start == end)
				this.erase(start,end+1);
			else
				this.erase(start,end);
		}
		
		// Left Arrow
		else if(code == 37) {
			this.move(-1);
		}
		
		// Right Arrow
		else if(code == 39) {
			this.move(1);
		}
		
		// Up Arrow
		else if(code == 38) {
			var index = this.parRule.subrules.indexOf(this), 
				num = this.parRule.subrules.length,
				pos = this.input.caret(),
				newInput;
				
			if(index > 0) {
				newInput = this.parRule.subrules[index-1].input;
				newInput.focus();
				newInput.caret(pos);
			}
		}

		// Down Arrow
		else if(code == 40) {
			var index = this.parRule.subrules.indexOf(this),
				num = this.parRule.subrules.length,
				pos = this.input.caret();
				
			if(index < num-1) {
				newInput = this.parRule.subrules[index+1].input;
				newInput.focus();
				newInput.caret(pos);

			}
		}

		
		else if((code < 48 || code > 90) && (code != 32 && code != 9)) {
			// Do Nothing
		}
		
		else {
			var text = String.fromCharCode(code);
			
			if(!event.shiftKey)
				text = text.toLowerCase();
			
			if( /[\sa-zA-Z0-9]/.test( text ) )
				this.insert(start,end, text);
		}
	};
	Subrule.prototype.caret = function(pos) {
		this.input.caret( Math.max(0, Math.min(pos, this.length())) );
	};
	Subrule.prototype.generate = function(depth) {
		if(depth < 0)
			return "...";

		var text = "", num = this.components.length, comp;
		
		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(isString(comp))
				text += comp;
			else {
				if(text.length < MAX_LENGTH)
					text += comp.generate(depth-1);
				else
					text += "...";
			}
		}
		
		return text;
	};
	
	Subrule.prototype._updateInput = function() {
		var start = this.input.range().start, text = "", num = this.components.length, comp;

		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(isString(comp))
				text += comp;
			else
				text += comp.name();
		}
		
		//alert(num + ", " + text);
		
		this.input.val(text);
	};

	Subrule.prototype.length = function() {
		var num = this.components.length, len = 0, comp;
		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(isString(comp))
				len += comp.length;
			else
				len += comp.name().length;
		}
		
		return len;
	};
	
	Subrule.prototype.erase = function(start, end) {
		var len = this.length();
		var oriStart = start;
		start = Math.max(0, Math.min(start, len));
		end = Math.max(0, Math.min(end, len));
		
		var num = this.components.length, comp, compStart = 0, sublen, eNum = 0;
		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(isString(comp)) {
				sublen = comp.length;
				
				if(start <= sublen && end <= sublen) {
					var front = comp.substring(0,start),
						back = comp.substring(end);
						
					eNum += end-start;
						
					this.components[i] = front + back;
					break;
				}
				
				// Not yet past start
				else if(start >= sublen) {
					end -= sublen;
					start -= sublen;
				}
				
				// Completely inside 
				else if(end > sublen) {
					end -= sublen;
					start -= sublen;
					
					eNum += comp.length;
					
					this.components.splice(i--, 1);
					num--;
				}
				else {
					eNum += end;
					
					this.components[i] = comp.substring(0,end);
					break;
				}
				
				compStart += sublen;
			}
			else {
				sublen = comp.name().length;
				
				if(start <= sublen && end <= sublen) {
					eNum += comp.name().length;
						
					this.components.splice(i--, 1);
					oriStart = compStart;

					break;
				}
				
				// Not yet past start
				else if(start >= sublen) {
					end -= sublen;
					start -= sublen;
				}
				
				// Completely inside 
				else if(end > sublen) {
					end -= sublen;
					start -= sublen;
					
					eNum += comp.name().length;
					
					this.components.splice(i--, 1);
					num--;
				}
				else {
					eNum += comp.name().length;
					
					this.components.splice(i--, 1);
					oriStart = compStart;
					break;
				}
				
				compStart += sublen;
			}
		}
		
		if(eNum > 0) {
			this._updateInput();
			this.input.caret(oriStart);
		}
	};
	
	Subrule.prototype._removeRule = function(rule) {
		var num = this.components.length, comp;
		
		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(!isString(comp))
				if(comp == rule) {
					this.components.splice(i--,1);
					num--;
				}
		}
	};
	
	Subrule.prototype.insert = function(start, end, text) {
		if(start != end)
			this.erase(start, end);
		
		var position = start;
		var oriPos = position, num = this.components.length, comp, sublen;
		
		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(isString(comp)) {
				sublen = comp.length;
				
				if(position > sublen) 
					position -= sublen;
				else {
					if(isString(text)) {
						if(isString(comp))
							this.components[i] = insert(comp, position, text);
						else
							this.components.splice(i, 0, text);
					}
					else {
						this.components[i] = comp.substring(0,position);
						this.components.splice(i+1,0, text);
						this.components.splice(i+2,0, comp.substring(position));
					}
					position = -1;
					break;
				}
			}
			else {
				sublen = comp.name().length;
				if(position >= sublen)
					position -= sublen;
				else if(position == 0) {
					this.components.splice(i,0, text);
					position = -1;
					break;
				}
				else {
					position = -2;
					break;
				}
			}
		}
			
		if(position == 0)
			this.components.push(text);
		
		this._updateInput();
		
		if(position != -2) {
			if(isString(text))
				this.input.caret(oriPos + text.length);		
			else
				this.input.caret(oriPos + text.name.length);			
		}
		else
			this.input.caret(oriPos);		
	};

	Subrule.prototype.move = function(amt) {
		var position = this.input.caret();
		var oriPos = position, num = this.components.length, comp, compPos = 0, sublen;
		
		for(var i = 0; i < num; i++) {
			comp = this.components[i];
			
			if(isString(comp)) {
				sublen = comp.length;
				
				if(position >= sublen) 
					position -= sublen;
				else {
					this.caret(oriPos+amt);
					return;
				}
				
				compPos += sublen;
			}
			else {
				sublen = comp.name().length;
				if(position > sublen)
					position -= sublen;
				else if(position == 0) {
					if(amt < 0)
						this.caret(oriPos+amt);
					else
						this.caret(oriPos+sublen);
					return;
				}
				else {
					var mm;
					
					if(amt < 0) {						
						if((mm = position) > 0)
							this.caret(oriPos-mm);
						else
							this.caret(oriPos+amt);
					}
					else {
						if((mm = sublen-position) > 0)
							this.caret(oriPos+mm);
						else
							this.caret(oriPos+amt);
					}
					return;
				}
				
				compPos += sublen;
			}
		}	

		this.caret(oriPos+amt);
	};

	
	Subrule.prototype.destroy = function() {
		this.input.remove();
		this.button.remove();
		this.span.remove();
		this.inputGroup.remove();
		
		this.components = [];
		
		this.parRule.removeSubrule(this);
	};

	
function Rule(parCFG, isRoot, name) {
	var me = this;
	
	this.id = name;

	this.parCFG = parCFG;
	this.isRoot = isRoot;
	this.subrules = [];
	
	this.canClick = true;
	
	// Create Buttons in Rule Menu
		this.inputGroup = $('<div>', {class:'input-group'});
		this.inputGroup.appendTo(divRules);
		
		this.xspan = $('<span>', {class:"input-group-btn"});
			this.xbutton = $('<span>', {class:"btn glyphicon glyphicon-remove"});
				this.xbutton.attr("aria-hidden","true");
			this.xbutton.appendTo(this.xspan);
			this.xbutton.mouseup( function() {me.destroy();} );
		this.xspan.appendTo(this.inputGroup);

		this.input = $('<input>', {type:"text", class:"form-control", placeholder:"Please enter a rule name.", value:name});
		this.input.on('input', function(evt) {me._key(evt);} );
		this.input.keydown( function(event) {me.key(event);} );
		this.input.appendTo(this.inputGroup);
		
		this.pspan = $('<span>', {class:"input-group-btn"});
			this.pbutton = $('<span>', {class:"btn glyphicon glyphicon glyphicon-menu-right"});
				this.pbutton.attr("aria-hidden","true");
			this.pbutton.appendTo(this.pspan);
			this.pbutton.mouseup( function() {me._insertRule();} );
		this.pspan.appendTo(this.inputGroup);
		
		this.rspan = $('<span>', {class:"input-group-btn"});
			this.rbutton = $('<span>', {class:"btn glyphicon glyphicon-list"});
				this.rbutton.attr("aria-hidden","true");
			this.rbutton.appendTo(this.rspan);
			this.rbutton.mouseup( function() {me._clickRule();} );
		this.rspan.appendTo(this.inputGroup);
					

		this.badgeSpan = $('<span>', {class:"badge", html:'0'});
		this.badgeSpan.appendTo(this.rspan);

	
			
	// Create Subrule Tab
		this.subTab = $('<div>', {class:"tab-pane fade", id:this.id});
			this.subTabLi = $('<li>', {class:"list-group-item"});
				this.subTabRow = $('<div>', {class:"row"});
					this.subTabSubs = $('<div>', {id:"div-" + name + "-subrules"});
					this.subTabSubs.appendTo(this.subTabRow);
				this.subTabRow.appendTo(this.subTabLi);
			this.subTabLi.appendTo(this.subTab);
		this.subTab.appendTo('#div-subtabs');
}
	Rule.prototype._key = function(evt) {
		_updateAllSubrules();
	};
	Rule.prototype._insertRule = function() {
		if(lastSub != null) {		
			var range = lastSub.input.range(), start = range.start, end = range.end;
			lastSub.insert(start, end, this);
			lastSub.caret(start+this.name().length);
		}
	};
	Rule.prototype._clickRule = function() {
		if(!this.canClick)
			return;
		
		if(currentRule) {
			currentRule.xbutton.attr('class','btn glyphicon glyphicon-remove ' + (currentRule.isRoot ? 'btn-warning' : ''));
			currentRule.pbutton.attr('class','btn glyphicon glyphicon glyphicon-menu-right ' + (currentRule.isRoot ? 'btn-warning' : ''));
			currentRule.rbutton.attr('class','btn glyphicon glyphicon-list ' + (currentRule.isRoot ? 'btn-warning' : ''));
			currentTab.attr('class','tab-pane fade');
		}
		
		this.xbutton.attr('class','btn glyphicon glyphicon-remove ' + (this.isRoot ? 'btn-danger' : 'btn-primary') + ' active');
		this.pbutton.attr('class','btn glyphicon glyphicon glyphicon-menu-right ' + (this.isRoot ? 'btn-danger' : 'btn-primary') + ' active');
		this.rbutton.attr('class','btn glyphicon glyphicon-list ' + (this.isRoot ? 'btn-danger' : 'btn-primary') + ' active');
		this.subTab.attr('class','tab-pane fade in active');	
		
		currentRule = this;
		currentTab = this.subTab;
	};	
	Rule.prototype._updateBadgeSpan = function() {
		this.badgeSpan.html(this.subrules.length);
	};	
	Rule.prototype.name = function() {
		return this.input.val();
	};
	Rule.prototype.random = function() {
		return this.subrules[Math.floor(Math.random()*this.subrules.length)];
	};
	Rule.prototype.key = function(event) {
		var code = event.which;
				
		// Up Arrow
		if(code == 38) {
			var index = this.parCFG.rules.indexOf(this), 
				num = this.parCFG.rules.length,
				pos = this.input.caret(),
				newInput;
				
			if(index > 1) {
				newInput = this.parCFG.rules[index-1].input;
				newInput.focus();
				newInput.caret(pos);
			}
			
			event.preventDefault();
		}

		// Down Arrow
		else if(code == 40) {
			var index = this.parCFG.rules.indexOf(this),
				num = this.parCFG.rules.length,
				pos = this.input.caret();
				
			if(index < num-1) {
				newInput = this.parCFG.rules[index+1].input;
				newInput.focus();
				newInput.caret(pos);

			}
			
			event.preventDefault();
		}
	};
	Rule.prototype.caret = function(pos) {
		this.input.caret( Math.max(0, Math.min(pos, this.input.val().length)) );
	};
	Rule.prototype.generate = function(depth) {
		if(this.subrules.length == 0)
			return "[No subrules for " + this.name() + "]";
		else
			return this.random().generate(depth);
	};
	Rule.prototype.addSubrule = function(text) {
		var sub = new Subrule(this, text);
		this.subrules.push(sub);
		allSubList.push(sub);
		
		this._updateBadgeSpan();
		return sub;
	};
	Rule.prototype.removeSubrule = function(sub) {
		var index = this.subrules.indexOf(sub);
		if(index != -1)
			this.subrules.splice(index,1);
		
		if((index = allSubList.indexOf(sub)) != -1)
			allSubList.splice(index, 1);

		this._updateBadgeSpan();
	};
	Rule.prototype.destroy = function() {
		if(this.isRoot)
			return false;
		
		// Delete Subrules
		var num = this.subrules.length;
		for(var i = num-1; i >= 0; i--)
			this.subrules[i].destroy();
		this.subrules = [];
		
		// Delete All HTML Elements
		this.badgeSpan.remove();
			this.input.remove();
		this.xbutton.remove();
			this.xspan.remove();
		this.pbutton.remove();
			this.pspan.remove();
		this.rbutton.remove();
			this.rspan.remove();
				this.inputGroup.remove();

		this.subTabLi.remove();
			this.subTabRow.remove();
				this.subTabSubs.remove();
					this.subTab.remove();

		
		if(currentRule == this) {
			var currentInd, newInd, num, newRule, oldRule;
			currentInd = this.parCFG.rules.indexOf(currentRule);
			num = this.parCFG.rules.length;
				
			if(currentInd == num-1)
				newInd = currentInd-1;
			else
				newInd = currentInd+1;
				
			oldRule = currentRule;
		
			newRule = this.parCFG.rules[newInd];
			newRule._clickRule();
		}

		_removeRuleFromAllSubrules(this);
		this.parCFG.removeRule(this);
		this.parCFG = null;
		
		return true;
	}


var ruleNum = 0
var addNewRule = function() {
	var rule = cfg.addRule("_A" + ruleNum++ + "_");
	
	return rule;
};


var insertRule = function() {
	currentRule.insert();
};

var _removeRuleFromAllSubrules = function(rule) {
	var num = allSubList.length, sub;
	
	for(var i = 0; i < num; i++) {
		sub = allSubList[i];
		
		sub._removeRule(rule);
		sub._updateInput();
	}
};

var _updateAllSubrules = function() {
	var num = allSubList.length;
	
	for(var i = 0; i < num; i++)
		allSubList[i]._updateInput();
};

var generateCFG = function(out) {
	var maxDepth;
	maxDepth = parseInt( $("#inputDepth").val() );
	text = cfg.generate(maxDepth);
	
	outputGen.val(text);
	
	return text;
};

var generateCFGFile = function() {
	var text = "", num;
	num = parseInt( $("#inputGenNum").val() );
	
	for(var i = 0; i < num; i++)
		text += generateCFG(false) + "\r\n";
	
	saveAs(new Blob([text], {type: "text/plain;charset=utf-8"}), "cfg_output.txt");
};
	

function CFG() {
	this.rules = [];
	this.rulesDict = {};
	
	this.addRoot();
}
	CFG.prototype.addRule = function(name) {
		var rule = new Rule(this, this.rules.length == 0, name);
		this.rules.push(rule);
		return rule;
	};
	CFG.prototype.removeRule = function(rul) {
		var index = this.rules.indexOf(rul);
		if(index != -1)
			this.rules.splice(index,1);
	};
	CFG.prototype.generate = function(maxDepth) {
		return this.rules[0].generate(maxDepth);
	};
	CFG.prototype.addRoot = function() {
		var rule = this.addRule('_ROOT_');

		rule._clickRule();		
	};


var cfg = new CFG();
