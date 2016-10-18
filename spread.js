(function($){
	var getEditableTable = function(data){
		var html = "";
		data.forEach(function(arr){
			html+="<tr>";
			arr.forEach(function(item){
				var inside = "<input type='text' value='"+item.value+"'>";
				if(item.type == "th"){
					var add ="<th colspan='"+item.colspan+"' rowspan='"+item.rowspan+"'>"+inside+"</th>";
				}else{
					var add ="<td>"+inside+"</td>";
				}
				html+= add;
			})
			html+="</tr>";
		});
		return html;
	}
	var parseTable = function(html){
		var arr1 = [];
		$("tr",html).each(function(){
			var arr2 = [];
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
			arr1.push(arr2);
		});
		return arr1;
	}
	$.fn.spread = function(){
		$(this).addClass("spread-table");
		var data = parseTable($(this).html());
		$(this).data("spread",data);
		var html = getEditableTable(data);
		$(this).html(html);
	}
})(jQuery);