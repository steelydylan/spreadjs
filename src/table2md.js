var $ = require("jquery");
var table2md = function(html){
	var $table = $(html);
	var ret = "";
	$table.find("tr").each(function(i){
		ret += "| ";
		$children = $(this).children();
		$children.each(function(){
			ret += $(this).html();
			ret += " | ";
		});
		if(i == 0){
			ret+="\n| ";
			$children.each(function(){
				ret += "--- | ";
			});
		}
		ret += "\n";
	});
	return ret;
};

module.exports = table2md;