(function(global) {
var aTemplate = require("./aTemplate.js");
var $ = require("jquery");
var template = require("./table.html");
var returnTable = require("./return-table.html");
var style = require("./spread.css");
var ids = [];
$("body").append("<style>"+style+"</style>");
var Spread = aTemplate.createClass(aTemplate.View,{
	initialize:function(ele){
		var id = this.getRandText(10);
		$(ele).wrap("<div data-id='"+id+"'></div>");
		this.addTemplate(template,id);
		this.inherit();
		this.data.point = {x:-1,y:-1};
		this.data.row = this.parse($(ele).html());
		$(ele).remove();
		this.update();
	},
	getRand:function(a,b){
		return ~~(Math.random() * (b - a + 1)) + a;
	},
	getRandText:function(limit){
		var ret = "";
		var strings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		var length = strings.length;
		for(var i = 0; i < limit; i++){
			ret += strings.charAt(Math.floor(this.getRand(0,length)));
		}
		return ret;
	},
	getPoint:function(item){
		
	},
	selectRange:function(a,b){
		var point = this.data.point;
		var minX = Math.min(a,point.x);
		var minY = Math.min(b,point.y);
		var maxX = Math.max(a,point.x);
		var maxY = Math.max(b,point.y);
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(i >= minX && i <= maxX && t >= minY && t <= maxY){
					obj.selected = true;
				}
			});
		});
		this.data.point = {x:a,y:b};
		this.update();
	},
	select:function(a,b){
		this.data.point = {x:a,y:b};
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(i !== a || t !== b){
					obj.selected = false;
				}
			});
		});
		if(!this.data.row[a].col[b].selected){
			this.data.row[a].col[b].selected = true;
			this.update();
		}
	},
	contextmenu:function(){
		this.e.preventDefault();
		this.data.showMenu = true;
		this.data.menuX = this.e.pageX;
		this.data.menuY = this.e.pageY;
		this.update();
	},
	parse:function(html){
		var arr1 = [];
		$("tr",html).each(function(){
			var ret2 = {};
			var arr2 = [];
			ret2.col = arr2;
			$("th,td",this).each(function(){
				var obj = {};
				if($(this).is("th")){
					obj.type = "th";
				}else{
					obj.type = "td";
				}
				obj.colspan = $(this).attr("colspan") || 1;
				obj.rowspan = $(this).attr("rowspan") || 1;
				obj.value = $(this).html();
				arr2.push(obj);
			});
			arr1.push(ret2);
		});
		return arr1;
	},
	getTopLeftPoint:function(){
		var minX = -1;
		var minY = -1;
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(obj.selected){
					if(minX == -1 || t <= minX){
						minX = t;
					}
					if(minY == -1 || i <= minY){
						minY = i;
					}
				}
			});
		});
		return {x:minX,y:minY};
	},
	getBottomRightPoint:function(){
		var maxX = -1;
		var maxY = -1;
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(obj.selected){
					if(t >= maxX){
						maxX = t;
					}
					if(i >= maxY){
						maxY = i;
					}
				}
			});
		});
		return {x:maxX,y:maxY};
	},
	getTable:function(){
		return this.getHtml(returnTable,true);
	},
	data:{
		highestRow:function(){
			var high = 0;
			var index = 0;
			var i = 0;
			var cols = [];
			this.data.row.forEach(function(item){
				if(item.col.length >= high){
					high = item.col.length;
					index = i;
				}
				i++;
			});
			this.data.row[index].col.forEach(function(item){
				var length = parseInt(item.colspan);
				for(var i = 0; i < length; i++){
					cols.push({});
				}
			});
			return cols;
		}
	},
	method:{
		updateTable:function(a,b){
			a = parseInt(a);
			b = parseInt(b);
			if(this.e.type == "click"){
				this.data.showMenu = false;
				if(this.e.shiftKey){
					this.selectRange(a,b);
				}else{
					this.select(a,b);
				}
			}else if(this.e.type == "contextmenu"){
				this.contextmenu();
			}else{
				this.data.row[a].col[b].value = $(this.e.target).text();
			}
		},
		mergeCell:function(){
			var pointMin = this.getTopLeftPoint();
			var pointMax = this.getBottomRightPoint();
			var colspan = pointMax.x - pointMin.x + 1;
			var rowspan = pointMax.y - pointMin.y + 1;
			this.data.row.forEach(function(item,i){
				var cols = item.col;
				for(var t = 0,n = cols.length; t < n; t++){
					var obj = cols[t];
					if(obj.selected){
						if(t !== pointMin.x || i !== pointMin.y){
							cols.splice(t,1);
							t--;
							n--;
						}else{
							obj.colspan = colspan;
							obj.rowspan = rowspan;
						}
					}
				}
			});
			this.data.showMenu = false;
			this.update();
		},
		makeTh:function(){
			this.data.row.forEach(function(item,i){
				item.col.forEach(function(obj,t){
					if(obj.selected){
						obj.type = "th";
					}
				});
			});
			this.data.showMenu = false;
			this.update();
		},
		makeTd:function(){
			this.data.row.forEach(function(item,i){
				item.col.forEach(function(obj,t){
					if(obj.selected){
						obj.type = "td";
					}
				});
			});
			this.data.showMenu = false;
			this.update();
		}
	},
	convert:{
		noToEn:function(i){
			return String.fromCharCode(97+parseInt(i));
		}
	}
});

if ("process" in global) {
	module["exports"] = Spread;
}
global["Spread"] = Spread;

})((this || 0).self || global);