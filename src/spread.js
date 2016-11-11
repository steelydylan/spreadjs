(function(global) {
var aTemplate = require("./aTemplate.js");
var $ = require("jquery");
var toMarkdown = require("./table2md.js");
var template = require("./table.html");
var returnTable = require("./return-table.html");
var style = require("./spread.css");
var ids = [];
$("body").append("<style>"+style+"</style>");
$("body").append("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'>");
var defs = {
	showBtnList:true,
	lang:"en"
}
var Spread = aTemplate.createClass(aTemplate.View,{
	initialize:function(ele,option){
		this.id = this.getRandText(10);
		$(ele).wrap("<div data-id='"+this.id+"'></div>");
		this.addTemplate(template,this.id);
		this.inherit();
		this.data = $.extend({},defs,option);
		this.data.point = {x:-1,y:-1};
		this.data.selectedRowNo = -1;
		this.data.selectedColNo = -1;
		this.data.showBtnList = true;
		this.data.row = this.parse($(ele).html());
		this.data.highestRow = this.highestRow;
		$(ele).remove();
		this.update();
	},
	highestRow:function(){
		var arr = [];
		this.data.row.forEach(function(item,i){
			if(!item || !item.col){
				return;
			}
			item.col.forEach(function(obj,t){
				var length = parseInt(obj.colspan);
				for (var i = 0; i < length; i++){
					arr.push(i);
				}
			});
		});
		return arr;
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
			if(!item.col){
				return false;
			}
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
	getSelectedPoint:function(){
		var arr = this.getSelectedPoints();
		if(arr && arr[0]){
			return arr[0];
		}
	},
	getAllPoints:function(){
		var arr = [];
		var self = this;
		this.data.row.forEach(function(item,i){
			if(!item || !item.col){
				return;
			}
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
			if(!item || !item.col){
				return;
			}
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
		if(!this.data.row[index.row]){
			return;
		}
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
			if(!item || !item.col){
				return false;
			}
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
			if(!item || !item.col){
				return false;
			}
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
	unselectCells:function(){
		this.data.row.forEach(function(item,i){
			if(!item || !item.col){
				return false;
			}
			item.col.forEach(function(obj,t){
				obj.selected = false;
			});
		});
	},
	removeCell:function(cell){
		var row = this.data.row;
		for(var i = 0, n = row.length; i < n; i++){
			var col = row[i].col;
			for(var t = 0, m = col.length; t < m; t++){
				var obj = col[t];
				if(obj === cell){
					col.splice(t,1);
					t--;
					m--;
				}
			}
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
		var $ele = $("[data-id='"+this.id+"']");
		var $target = $(this.e.target);
		this.e.preventDefault();
		this.data.showMenu = true;
		this.data.menuX = parseInt($target.offset().left) - parseInt($ele.offset().left);
		this.data.menuY = parseInt($target.offset().top) - parseInt($ele.offset().top);
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
	getMarkdown:function(){
		return toMarkdown(this.getHtml(returnTable,true));
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
	//行の追加
	insertRow: function(a,row){
		if(this.data.row[a]){
			this.data.row.splice(a,0,{col:row});
		}else if(this.data.row.length == a){
			this.data.row.push({col:row});
		}
	},
	insertCellAt: function(a,b,item) {
		if(this.data.row[a] && this.data.row[a].col){
	    	this.data.row[a].col.splice(b,0,item);
		}
	},
	selectRowViaBtn:function(i){
		if(this.e.type != "click"){
			return;
		}
		this.unselectCells();
		this.contextmenu();
		this.data.mode = "col";
		this.data.selectedColNo = -1;
		this.data.selectedRowNo = i;
		this.update();
	},
	selectRow:function(i){
		if (this.e.type == "contextmenu"){
			this.unselectCells();
			this.contextmenu();
		}else if(this.e.type == "click"){
			this.unselectCells();
			this.data.showMenu = false;
		} else {
			return;
		}
		this.data.mode = "col";
		this.data.selectedColNo = -1;
		this.data.selectedRowNo = i;
		this.update();
	},
	selectCol:function(i){
		if(this.e.type == "contextmenu"){
			this.unselectCells();
			this.contextmenu();
		} else if(this.e.type == "click"){
			this.unselectCells();
			this.data.showMenu = false;
		} else{
			return;
		}
		this.data.mode = "row";
		this.data.selectedRowNo = -1;
		this.data.selectedColNo = i;
		this.update();
	},
	selectColViaBtn:function(i){
		if(this.e.type != "click"){
			return;
		}
		this.unselectCells();
		this.contextmenu();
		this.data.mode = "row";
		this.data.selectedRowNo = -1;
		this.data.selectedColNo = i;
		this.update();
	},
	removeCol:function(selectedno){
		if(this.e.type != "click"){
			return;
		}
		this.data.showMenu = false;
		var self = this;
		var points = this.getAllPoints();
		var point1 = this.getLargePoint.apply(null,points);
		var newpoint = {x:parseInt(selectedno),y:0,width:1,height:point1.height};
		var targetPoints = [];
		points.forEach(function(point){
			if(self.hitTest(newpoint,point)){
				targetPoints.push(point);
			}
		});
		targetPoints.forEach(function(point){
			var index = self.getCellIndexByPos(point.x,point.y);
			var cell = self.getCellByPos(point.x,point.y);
			if(cell.colspan == 1){
				self.removeCell(cell);
			}else{
				cell.colspan = parseInt(cell.colspan) - 1;
			}
		});
		this.update();
	},
	removeRow:function(selectedno){
		if(this.e.type != "click"){
			return;
		}
		this.data.showMenu = false;
		var self = this;
		var points = this.getAllPoints();
		var point1 = this.getLargePoint.apply(null,points);
		selectedno = parseInt(selectedno);
		var newpoint = {x:0,y:selectedno,width:point1.width,height:1};
		var nextpoint = {x:0,y:selectedno+1,width:point1.width,height:1};
		var targetPoints = [];
		var removeCells = [];
		var insertCells = [];
		points.forEach(function(point){
			if(self.hitTest(newpoint,point)){
				targetPoints.push(point);
			}
		});
		points.forEach(function(point){
			if(self.hitTest(nextpoint,point)){
				var cell = self.getCellByPos(point.x,point.y);
				cell.x = point.x;
				if(point.y == nextpoint.y){
					insertCells.push(cell);
				}
			}
		});
		targetPoints.forEach(function(point){
			var cell = self.getCellByPos(point.x,point.y);
			if(cell.rowspan == 1){
				removeCells.push(cell);
			}else{
				cell.rowspan = parseInt(cell.rowspan) - 1;
				if(selectedno == point.y){
					cell.x = point.x;
					insertCells.push(cell);
				}
			}
		});
		insertCells.sort(function(a,b){
			if(a.x > b.x){
				return 1;
			}else{
				return -1;
			}
		});
		removeCells.forEach(function(cell){
			self.removeCell(cell);
		});
		this.data.row.splice(selectedno,1);
		if(insertCells.length > 0) {
			this.data.row[selectedno] = {col:insertCells};
		}
		this.update();
	},
	updateTable:function(b,a){
		if(this.e.type === "mouseup" && this.data.showMenu){
			return;
		}
		a = parseInt(a);
		b = parseInt(b);
		this.data.mode = "cell";
		this.data.selectedRowNo = -1;
		this.data.selectedColNo = -1;
		this.data.showMenu = false;
		if(this.e.type == "click"){
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
			this.data.row[a].col[b].value = $(this.e.target).html();
			if(this.afterEntered){
				this.afterEntered();
			}
		}
	},
	insertColRight:function(selectedno){
		if(this.e.type != "click"){
			return;
		}
		this.data.selectedRowNo = parseInt(selectedno);
		this.data.showMenu = false;
		var self = this;
		var points = this.getAllPoints();
		var point1 = this.getLargePoint.apply(null,points);
		var newpoint = {x:parseInt(selectedno),y:0,width:1,height:point1.height};
		var targetPoints = [];
		points.forEach(function(point){
			if(self.hitTest(newpoint,point)){
				targetPoints.push(point);
			}
		});
		targetPoints.forEach(function(point){
			var index = self.getCellIndexByPos(point.x,point.y);
			var cell = self.getCellByPos(point.x,point.y);
			var newcell = {type:"td",colspan:1,rowspan:cell.rowspan,value:""};
			if(typeof index.row !== "undefined" && typeof index.col !== "undefined"){
				if(point.width + point.x - newpoint.x > 1){
					cell.colspan = parseInt(cell.colspan) + 1;
					cell.colspan += "";
				}else{
					self.insertCellAt(index.row,index.col+1,newcell);
				}
			}
		});
		this.update();
	},
	insertColLeft:function(selectedno){
		if(this.e.type != "click"){
			return;
		}
		this.data.selectedRowNo = parseInt(selectedno)+1;
		this.data.showMenu = false;
		var self = this;
		var points = this.getAllPoints();
		var point1 = this.getLargePoint.apply(null,points);
		var newpoint = {x:parseInt(selectedno)-1,y:0,width:1,height:point1.height};
		var targetPoints = [];
		points.forEach(function(point){
			if(self.hitTest(newpoint,point)){
				targetPoints.push(point);
			}
		});
		if(selectedno == 0){
			var length = point1.height;
			for(var i = 0; i < length; i++){
				var newcell = {type:"td",colspan:1,rowspan:1,value:""};
				self.insertCellAt(i,0,newcell);
			}
			self.update();
			return;
		}
		targetPoints.forEach(function(point){
			var index = self.getCellIndexByPos(point.x,point.y);
			var cell = self.getCellByPos(point.x,point.y);
			var newcell = {type:"td",colspan:1,rowspan:cell.rowspan,value:""};
			if(typeof index.row !== "undefined" && typeof index.col !== "undefined"){
				if(point.width + point.x - newpoint.x > 1){
					cell.colspan = parseInt(cell.colspan) + 1;
					cell.colspan += "";
				}else{
					self.insertCellAt(index.row,index.col+1,newcell);
				}
			}
		});
		this.update();
	},
	insertRowBelow:function(selectedno){
		if(this.e.type != "click"){
			return;
		}
		this.data.showMenu = false;
		this.data.selectedColNo = parseInt(selectedno);
		var self = this;
		var points = this.getAllPoints();
		var point1 = this.getLargePoint.apply(null,points);
		selectedno = parseInt(selectedno);
		var newpoint = {x:0,y:selectedno+1,width:point1.width,height:1};
		var targetPoints = [];
		var newRow = [];
		points.forEach(function(point){
			if(self.hitTest(newpoint,point)){
				targetPoints.push(point);
			}
		});
		if(targetPoints.length == 0){
			var length = point1.width;
			for(var i = 0; i < length; i++){
				var newcell = {type:"td",colspan:1,rowspan:1,value:""};
				newRow.push(newcell);
			}
			self.insertRow(selectedno+1,newRow);
			self.update();
			return;
		}
		targetPoints.forEach(function(point){
			var index = self.getCellIndexByPos(point.x,point.y);
			var cell = self.getCellByPos(point.x,point.y);
			if(!cell){
				return;
			}
			var newcell = {type:"td",colspan:1,rowspan:1,value:""};
			if(typeof index.row !== "undefined" && typeof index.col !== "undefined"){
				if (point.height > 1 && point.y <= selectedno) {
					cell.rowspan = parseInt(cell.rowspan) + 1;
					cell.rowspan += "";
				} else if (index.row == selectedno+1) {
					var length = parseInt(cell.colspan);
					for(var i = 0; i < length; i++){
						newRow.push({type:"td",colspan:1,rowspan:1,value:""});
					}
				} else {
					self.insertCellAt(index.row+1,index.col,newcell);
				}
			}
		});
		this.insertRow(selectedno+1,newRow);
		this.update();
	},
	insertRowAbove:function(selectedno){
		if(this.e.type != "click"){
			return;
		}
		this.data.showMenu = false;
		this.data.selectedColNo = parseInt(selectedno)+1;
		var self = this;
		var points = this.getAllPoints();
		var point1 = this.getLargePoint.apply(null,points);
		selectedno = parseInt(selectedno);
		var newpoint = {x:0,y:selectedno-1,width:point1.width,height:1};
		var targetPoints = [];
		var newRow = [];
		points.forEach(function(point){
			if(self.hitTest(newpoint,point)){
				targetPoints.push(point);
			}
		});
		if(selectedno == 0){
			var length = point1.width;
			for(var i = 0; i < length; i++){
				var newcell = {type:"td",colspan:1,rowspan:1,value:""};
				newRow.push(newcell);
			}
			self.insertRow(0,newRow);
			self.update();
			return;
		}
		targetPoints.forEach(function(point){
			var index = self.getCellIndexByPos(point.x,point.y);
			var cell = self.getCellByPos(point.x,point.y);
			if(!cell){
				return;
			}
			var newcell = {type:"td",colspan:1,rowspan:1,value:""};
			if(typeof index.row !== "undefined" && typeof index.col !== "undefined"){
				if (point.height > 1) {
					cell.rowspan = parseInt(cell.rowspan) + 1;
					cell.rowspan += "";
				} else if (index.row == selectedno-1) {
					var length = parseInt(cell.colspan);
					for(var i = 0; i < length; i++){
						newRow.push({type:"td",colspan:1,rowspan:1,value:""});
					}
				} else {
					self.insertCellAt(index.row,index.col,newcell);
				}
			}
		});
		this.insertRow(selectedno,newRow);
		this.update();
	},
	mergeCells:function(){
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
	splitCell:function(){
		var point = this.getSelectedPoint();

	},
	changeCellTypeTo:function(type){
		if(this.e.type != "click"){
			return;
		}
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(obj.selected){
					obj.type = type;
				}
			});
		});
		this.data.showMenu = false;
		this.update();
	},
	align:function(align){
		if(this.e.type != "click"){
			return;
		}
		this.data.row.forEach(function(item,i){
			item.col.forEach(function(obj,t){
				if(obj.selected){
					obj.align = align;
				}
			});
		});
		this.data.showMenu = false;
		this.update();
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
