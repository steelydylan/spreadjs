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
		this.id = this.getRandText(10);
		$(ele).wrap("<div data-id='"+this.id+"'></div>");
		this.addTemplate(template,this.id);
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
	getCellByIndex:function(x,y){
		return $("[data-id='"+this.id+"'] [data-cell-id='"+x+"-"+y+"']");
	},
	getCellInfoByIndex:function(x,y){
		var id = this.id;
		var $cell = this.getCellByIndex(x,y);
		if($cell.length == 0){
			return false;
		}
		var left = $cell.offset().left;
		var top = $cell.offset().top;
		var returnLeft = -1;
		var returnTop = -1;
		var width = parseInt($cell.attr("colspan"));
		var height = parseInt($cell.attr("rowspan"));
		$("[data-id='"+this.id+"'] .js-table-header th").each(function(i){
			if($(this).offset().left == left){
				returnLeft = i;
			}
		});
		$("[data-id='"+this.id+"'] .js-table-side").each(function(i){
			if($(this).offset().top == top){
				returnTop = i;
			}
		});
		return {x:returnLeft-1,y:returnTop,width:width,height:height};
	},
	/*pointが入る*/
	getLargePoint:function(){
		var minXArr = [];
		var minYArr = [];
		var maxXArr = [];
		var maxYArr = [];
		for(var i = 0, n = arguments.length; i < n; i++){
			minXArr.push(arguments[i].x);
			minYArr.push(arguments[i].y);
			maxXArr.push(arguments[i].x+arguments[i].width);
			maxYArr.push(arguments[i].y+arguments[i].height);
		}
		var minX = Math.min.apply(Math,minXArr);
		var minY = Math.min.apply(Math,minYArr);
		var maxX = Math.max.apply(Math,maxXArr);
		var maxY = Math.max.apply(Math,maxYArr);
		return {x:minX,y:minY,width:maxX-minX,height:maxY-minY};
	},
	getSelectedPoints:function(){
		var arr = [];
		var self = this;
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(obj.selected){
					var point = self.getCellInfoByIndex(t,i);
					if(point){
						arr.push(point);
					}
				}
			});
		});
		return arr;
	},
	getAllPoints:function(){
		var arr = [];
		var self = this;
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				var point = self.getCellInfoByIndex(t,i);
				if(point){
					arr.push(point);
				}
			});
		});
		return arr;
	},
	getCellIndexByPos:function(x,y){
		var a,b;
		var self = this;
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				var point = self.getCellInfoByIndex(t,i);
				if(point.x == x && point.y == y){
					a = t;
					b = i;
				}
			});
		});
		return {row:b,col:a};
	},
	getCellByPos:function(x,y){
		var index = this.getCellIndexByPos(x,y);
		return this.data.row[index.row].col[index.col];
	},
	hitTest:function(point1,point2){
		if((point1.x < point2.x + point2.width)
		&& (point2.x < point1.x + point1.width)
		&& (point1.y < point2.y + point2.height)
		&& (point2.y < point1.y + point1.height)){
			return true;
		}else{
			return false;
		}
	},
	selectRange:function(a,b){
		if(!this.data.point){
			return;
		}
		var self = this;
		this.data.row[a].col[b].selected = true;
		var points = this.getSelectedPoints();
		var point3 = this.getLargePoint.apply(null,points);
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				var point = self.getCellInfoByIndex(t,i);
				if(point && self.hitTest(point3,point)){
					obj.selected = true;
				}
			});
		});
		if(points.length > 1){
			this.update();
		}
	},
	select:function(a,b){
		this.data.point = {x:b,y:a};
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(i !== a || t !== b){
					obj.selected = false;
				}
			});
		});
		if(!this.data.row[a].col[b].selected){
			this.data.row[a].col[b].selected = true;
		}
	},
	removeSelectedCellExcept:function(cell){
		var row = this.data.row;
		for(var i = 0, n = row.length; i < n; i++){
			var col = row[i].col;
			for(var t = 0, m = col.length; t < m; t++){
				var obj = col[t];
				if(obj !== cell && obj.selected){
					col.splice(t,1);
					t--;
					m--;
				}
			}
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
	getTable:function(){
		return this.getHtml(returnTable,true);
	},
	onUpdated:function(){
		var points = this.getAllPoints();
		var point = this.getLargePoint.apply(null,points);
		var width = point.width;
		$(".js-table-header th:gt("+width+")","[data-id='"+this.id+"']").remove();
		if(this.afterRendered){
			this.afterRendered();
		}
	},
	insertCellAt: function(a,b,item) {
		if(this.data.row[a]){
	    	this.data.row[a].col.splice(b+1,0,item);
		}
	},
	data:{
		highestRow:function(){
			var arr = [];
			this.data.row.forEach(function(item,i){
				item.col.forEach(function(obj,t){
					var length = parseInt(obj.colspan);
					for (var i = 0; i < length; i++){
						arr.push(i);
					}
				});
			});
			return arr;
		}
	},
	method:{
		updateTable:function(b,a){
			a = parseInt(a);
			b = parseInt(b);
			if(this.e.type == "click"){
				this.data.showMenu = false;
				if(this.e.shiftKey){
					this.selectRange(a,b);
				}
			}else if(this.e.type == "mousedown"){
				if(this.e.button !== 2){
					this.mousedown = true;
					if(!this.data.row[a].col[b].selected){
						this.select(a,b);
						this.update();
					}else{
						this.select(a,b);
					}
				}
			}else if(this.e.type == "mousemove"){
				if(this.mousedown){
					this.selectRange(a,b);
				}
			}else if(this.e.type == "mouseup"){
				this.mousedown = false;
				this.selectRange(a,b);
			}else if(this.e.type == "contextmenu"){
				this.mousedown = false;
				this.contextmenu();
			}else{
				this.data.row[a].col[b].value = $(this.e.target).text();
			}
		},
		addRightCells:function(){
			if(this.e.type != "click"){
				return;
			}
			var self = this;
			var points = this.getAllPoints();
			var point1 = this.getLargePoint.apply(null,points);
			var selectedPoints = this.getSelectedPoints();
			var point2 = this.getLargePoint.apply(null,selectedPoints);
			var newpoint = {x:point2.x+point2.width-1,y:0,width:1,height:point1.height};
			var targetPoints = [];
			points.forEach(function(point){
				if(self.hitTest(newpoint,point)){
					targetPoints.push(point);
				}
			});
			targetPoints.forEach(function(point){
				var index = self.getCellIndexByPos(point.x,point.y);
				var cell = self.getCellByPos(point.x,point.y);
				var newcell = {type:"td",colspan:1,rowspan:1,value:""};
				if(typeof index.row !== "undefined" && typeof index.col !== "undefined"){
					if(point.width + point.x - newpoint.x > 1){
						cell.colspan = parseInt(cell.colspan) + 1;
						cell.colspan += "";
					}else{
						self.insertCellAt(index.row,index.col,newcell)
					}
				}
			});
			this.data.showMenu = false;
			this.update();
		},
		mergeCell:function(){
			if(this.e.type != "click"){
				return;
			}
			var points = this.getSelectedPoints();
			var point = this.getLargePoint.apply(null,points);
			var cell = this.getCellByPos(point.x,point.y);
			this.removeSelectedCellExcept(cell);
			cell.colspan = point.width;
			cell.rowspan = point.height;
			this.data.showMenu = false;
			this.update();
		},
		makeTh:function(){
			if(this.e.type != "click"){
				return;
			}
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
			if(this.e.type != "click"){
				return;
			}
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
