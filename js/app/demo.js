/**
 *模型分析
 */


/**模型计数器*/
var modelCounter = 0;
/**
 * 初始化一个jsPlumb实例
 */
var instance = jsPlumb.getInstance({
	DragOptions: { cursor: "pointer", zIndex: 2000 },
	ConnectionOverlays: [
			[ "Arrow", {
			    location: 1,
			    visible:true,
			    width:11,
			    length:11,
			    direction:1,
			    id:"arrow_forwards"
			} ],
			[ "Arrow", {
			    location: 0,
			    visible:true,
			    width:11,
			    length:11,
			    direction:-1,
			    id:"arrow_backwards"
			} ],
            [ "Label", {
                location: 0.5,
                id: "label",
                cssClass: "aLabel"
            }]
        ],
	Container: "container"
});
instance.importDefaults({
	 ConnectionsDetachable:true,
	 ReattachConnections:true
});
/**
 * 设置左边菜单
 * @param Data
 */
function setLeftMenu(list)
{
	for(var obj in list){
		for(var tmp in list[obj]){
			var element_str = '<li id="' + list[obj][tmp].index + '" model_type="' + tmp + '">' + list[obj][tmp].name + '</li>';
			$("#leftMenu").append(element_str);
		}
	}
	//拖拽设置
	$("#leftMenu li").draggable({
		helper: "clone",
		scope: "plant"
	});
	$("#container").droppable({
		scope: "plant",
		drop: function(event, ui){
			CreateModel(ui, $(this));
		}
	});
}
/**
 * 添加模型
 * @param ui
 * @param selector
 */
function CreateModel(ui, selector)
{
	var modelId = $(ui.draggable).attr("id");
	var id = modelId + "_model_" + modelCounter++;
	var type = $(ui.draggable).attr("model_type");
	$(selector).append('<div class="model" id="' + id 
			+ '" modelType="'+ type +'">' 
			+ getModelElementStr(type) + '</div>');
	var left = parseInt(ui.offset.left - $(selector).offset().left);
	var top = parseInt(ui.offset.top - $(selector).offset().top);
	$("#"+id).css("position","absolute").css("left",left).css("top",top);
	//添加连接点
	instance.addEndpoint(id, { anchors: "RightMiddle" }, hollowCircle);
	instance.addEndpoint(id, { anchors: "LeftMiddle" }, hollowCircle);
	instance.addEndpoint(id, { anchors: "TopCenter" }, hollowCircle);
	instance.addEndpoint(id, { anchors: "BottomCenter" }, hollowCircle);
	//注册实体可draggable
	$("#" + id).draggable({
		containment: "parent",
		drag: function (event, ui) {
			instance.repaintEverything();
		},
		stop: function () {
			instance.repaintEverything();
		}
	});
}
//端点样式设置
var hollowCircle = {
	endpoint: ["Dot",{ cssClass: "endpointcssClass"}], //端点形状
	connectorStyle: connectorPaintStyle,
	paintStyle: {
		fill: "#62A8D1",
		radius: 6
	},		//端点的颜色样式
	isSource: true, //是否可拖动（作为连接线起点）
	connector: ["Flowchart", {stub: 30, gap: 0, coenerRadius: 0, alwaysRespectStubs: true, midpoint: 0.5 }],
	isTarget: true, //是否可以放置（连接终点）
	maxConnections: -1
};
//基本连接线样式
var connectorPaintStyle = {
	stroke: "#62A8D1",
	strokeWidth: 2
};
/**
 * 创建模型内部元素
 * @param type
 * @returns {String}
 */
function getModelElementStr(type)
{
	var list = '';
	for(var data in metadata){
		for(var data_type in metadata[data]){
			var model_data = metadata[data][data_type];
			if(type == model_data.type){
				list += '<h4><span index="' 
					+ model_data.index + '">' 
					+ model_data.name 
					+ '</span><a href="javascript:void(0)" class="pull-right" onclick="removeElement(this);">X</a>'
					+ '</h4>';
				list += '<ul>'
				var properties = model_data.properties;
				list += parseProperties(properties);
				list += '</ul>';
			}
		}
	}
	return list;
}
/**
 * 循环遍历properties
 * @param obj
 * @returns {String}
 */
function parseProperties(obj)
{
	var str = "";
	for(var v in obj){
		if(obj[v].properties == undefined){
			str += '<li><input type="checkbox" name="'
				+ v + '" value="'
				+ v + '">' 
				+ obj[v].des + '</li>';
		}else{
			str += arguments.callee(obj[v].properties);
		}
	}
	return str;
}
//设置连接Label的label
function init(conn)
{
	var label_text;
	$("#select_sourceList").empty();
	$("#select_targetList").empty();
	var sourceName = $("#" + conn.sourceId).attr("modelType");
	var targetName = $("#" + conn.targetId).attr("modelType");
	for(var i = 0; i < metadata.length; i++){
		for(var obj in metadata[i]){
			if(obj == sourceName){
				var optionStr = getOptions(metadata[i][obj].properties,metadata[i][obj].name);
				$("#select_sourceList").append(optionStr);
			}else if(obj == targetName){
				var optionStr = getOptions(metadata[i][obj].properties,metadata[i][obj].name);
				$("#select_targetList").append(optionStr);
			}
		}
	}
	$("#submit_label").unbind("click");
	$("#submit_label").on("click",function(){
		setlabel(conn);
	});
	$("#myModal").modal();
}
/**
 * 获取option
 * @param obj
 * @returns {String}
 */
function getOptions(obj,head)
{
	var str = "";
	for(var v in obj){
		if(obj[v].properties == undefined){
			var val = head + '.' + obj[v].des;
			str += '<option value="' + val + '">'
					+val
					+'</option>';
		}else{
			str += arguments.callee(obj[v].properties,head);
		}
	}
	return str;
}
//setlabel
function setlabel(conn)
{
	conn.getOverlay("label").setLabel($("#select_sourceList").val() 
			+ ' ' 
			+ $("#select_comparison").val()
			+ ' '
			+ $("#select_targetList").val());
	if($("#twoWay").val()=="true"){
		conn.setParameter("twoWay",true);
	}else{
		conn.setParameter("twoWay",false);
		conn.hideOverlay("arrow_backwards");
	}
}
//删除节点
function removeElement(obj)
{
	var element = $(obj).parents(".model");
	if(confirm("确定删除该模型？"))
		instance.remove(element);
}

