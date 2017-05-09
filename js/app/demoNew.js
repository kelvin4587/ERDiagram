//删除对象属性
function removeProperty(property) {
    $(property).parent().remove();
    instance.repaintEverything();
}
$(function () {
    /**模型计数器*/
    var modelCounter = 1;
    /**
     * 初始化一个jsPlumb实例
     */
    var instance = jsPlumb.getInstance({
        DragOptions: {cursor: "pointer", zIndex: 2000},
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                visible: true,
                width: 11,
                length: 11,
                direction: 1,
                id: "arrow_forwards"
            }],
            ["Arrow", {
                location: 0,
                visible: true,
                width: 11,
                length: 11,
                direction: -1,
                id: "arrow_backwards"
            }],
            ["Arrow", {
                location: 1,
                visible: false,
                width: 11,
                length: 11,
                direction: 1,
                foldback: 2,
                id: "multi_arrow_forwards"
            }],
            ["Arrow", {
                location: 0,
                visible: false,
                width: 11,
                length: 11,
                direction: -1,
                foldback: 2,
                id: "multi_arrow_backwards"
            }],
            ["Label", {
                location: 0.5,
                id: "label",
                cssClass: "aLabel"
            }]
        ],
        Container: "container"
    });
    instance.importDefaults({
        ConnectionsDetachable: true,
        ReattachConnections: true
    });
    function editFormSubmit(objectId) {
        var title = $('#' + objectId + '_title_form').val();
        if (title) {
            $('#' + objectId + '_title').text(title);
        }
        var properties = $('#' + objectId + '_property_list').children();
        for (var i = 0; i < properties.length; i++) {
            var property = $('#' + properties[i].id + '_form').val();
            if (property) {
                var innerHmtl = '<input type="checkbox">' + property + '<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span>';
                $(properties[i]).empty();
                $(properties[i]).append(innerHmtl);
            }
        }
    }

    /**
     * 添加模型
     * @param ui
     * @param selector
     */
    function createModel(ui, selector) {
        bootbox.setLocale("zh_CN");
        bootbox.prompt({
            value: "对象" + modelCounter, title: "请输入对象名", callback: function (title) {
                var modelId = $(ui.draggable).attr("id");
                var id = modelId + "_model_" + modelCounter++;
                var type = $(ui.draggable).attr("model_type");
                $(selector).append('<div class="model model-property-plant" id="' + id
                    + '" modelType="' + type + '">'
                    + getModelHtml(title, id) + '</div>');
                var left = parseInt(ui.offset.left - $(selector).offset().left);
                var top = parseInt(ui.offset.top - $(selector).offset().top);
                $("#" + id).css("position", "absolute").css("left", left).css("top", top);
                //添加连接点
                instance.addEndpoint(id, {anchors: dynamicAnchors}, hollowCircle);
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
                $("#" + id + "_title").dblclick(function () {
                    $(this).attr('contenteditable', true);
                    $(this).focus();
                })

                $.contextMenu({
                    selector: '.context-menu-setting',
                    callback: function (key, options) {
                        if (key == 'delete') {
                            var objectDiagramId = this.context.id;
                            objectDiagramId = objectDiagramId.substring(0, objectDiagramId.length - 13);
                            removeObjectDiagram(objectDiagramId);
                        }
                        if (key == 'edit') {
                            var objectDiagramId = this.context.id;
                            objectDiagramId = objectDiagramId.substring(0, objectDiagramId.length - 13);
                            var html = getPropertiesFormHtml(objectDiagramId);
                            $('#properties_edit_form').empty();
                            $('#properties_edit_form').append(html);
                            $("#edit_submit").unbind("click");
                            $("#edit_submit").on("click", function () {
                                editFormSubmit(objectDiagramId);
                            });
                            $("#edit_modal").modal();
                        }
                    },
                    items: {
                        "edit": {name: "编辑", icon: "edit"},
                        "delete": {name: "删除", icon: "delete"},
                        "sep1": "---------",
                        "quit": {
                            name: "退出", icon: function () {
                                return 'context-menu-icon context-menu-icon-quit';
                            }
                        }
                    }
                });
                $(".model-property-plant").droppable({
                    scope: "object",
                    drop: function (event, ui) {
                        bootbox.setLocale("zh_CN");
                        var objectId = this.id;
                        bootbox.prompt("请输入属性名", function (propertyName) {
                            var propertyList = $('#' + objectId + '_property_list');
                            var index = propertyList[0].childNodes.length;
                            var propertyHtml = '<li id="' + objectId + '_property_' + index + '"><input type="checkbox">' + propertyName + '<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span></li>';
                            propertyList.append(propertyHtml);
                            instance.repaintEverything();
                        });
                    }
                });

            }
        });

    }

//端点样式设置
    var hollowCircle = {
        endpoint: ["Dot", {cssClass: "endpointcssClass"}], //端点形状
        connectorStyle: connectorPaintStyle,
        paintStyle: {
            fill: "#62A8D1",
            radius: 5
        },		//端点的颜色样式
        isSource: true, //是否可拖动（作为连接线起点）
        connector: ["Bezier"],
        isTarget: true, //是否可以放置（连接终点）
        maxConnections: -1
    };
//基本连接线样式
    var connectorPaintStyle = {
        stroke: "#62A8D1",
        strokeWidth: 2
    };
    var dynamicAnchors = [
        [1, 0.2, 1, 0], [0, 0.2, -1, 0]
    ];

    /**
     * 创建模型内部元素
     * @param type
     * @returns {String}
     */
    function getModelHtml(title, id) {
        var list = '';
        list += '<h4><span id="' + id + '_title">'
            + title
            + '</span><span href="javascript:void(0)" class="context-menu-setting pull-right" id="' + id + '_setting_menu"><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></a>'
            + '</h4>';
        list += '<ul id="' + id + '_property_list">';
        list += '<li id="' + id + '_property_0"><input type="checkbox" name="object_id" value="object_id">ID<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span></li>';
        list += '<li id="' + id + '_property_1"><input type="checkbox" name="created_by" value="created_by">createdBy<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span></li>';
        list += '<li id="' + id + '_property_2"><input type="checkbox" name="created_time" value="created_time">createTime<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span></li>';
        list += '<li id="' + id + '_property_3"><input type="checkbox" name="last_updated_by" value="last_updated_by">lastUpdatedBy<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span></li>';
        list += '<li id="' + id + '_property_4"><input type="checkbox" name="last_updated_time" value="last_updated_time">lastUpdatedTime<span href="javascript:void(0)" class="pull-right" onclick="removeProperty(this);"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span></li>';
        list += '</ul>';
        return list;
    }

//设置连接Label的label
    function init(conn) {
        var label_text;
        $("#select_source_list").empty();
        $("#select_target_list").empty();
        var sourceId = $("#" + conn.sourceId).attr('id');
        var targetId = $("#" + conn.targetId).attr('id');
        var optionStr = getOptionsHtml(sourceId);
        $("#select_source_list").append(optionStr);
        optionStr = getOptionsHtml(targetId);
        $("#select_target_list").append(optionStr);
        $("#link_submit").unbind("click");
        $("#link_submit").on("click", function () {
            setlabel(conn);
        });
        $("#link_modal").modal();
    }

    function getPropertiesFormHtml(objectId) {
        var title = $('#' + objectId + '_title').text();
        var propertyList = $('#' + objectId + '_property_list');
        var checkedProperties = propertyList.find(':checked');
        var html = '';
        html += '<label for="input_title" class="col-sm-2 control-label">对象名</label>'
            + '<div class="col-sm-10">'
            + '<input type="text" class="form-control" id="' + objectId + '_title_form" value="' + title + '">'
            + '</div>';
        if (checkedProperties.length == 0) {
            var properties = propertyList.children();
            for (var i = 0; i < properties.length; i++) {
                html += '<label for="input_property' + i + '" class="col-sm-2 control-label">属性名</label>'
                    + '<div class="col-sm-10">'
                    + '<input type="text" class="form-control" id="' + properties[i].id + "_form"
                    + '" placeholder="' + properties[i].innerText + '">'
                    + '</div>';
            }
        } else {
            for (var j = 0; j < checkedProperties.length; j++) {
                var checkedProperty = $(checkedProperties[j]).parent();
                html += '<label for="input_property' + i + '" class="col-sm-2 control-label">属性名</label>'
                    + '<div class="col-sm-10">'
                    + '<input type="text" class="form-control" id="' + checkedProperty[0].id + "_form"
                    + '" placeholder="' + checkedProperty[0].innerText + '">'
                    + '</div>';
            }
        }
        return html;
    }

    /**
     * 获取option
     * @param obj
     * @returns {String}
     */
    function getOptionsHtml(objectId) {
        var properties = $('#' + objectId + '_property_list').children();
        var html = '';
        for (var i = 0; i < properties.length; i++) {
            html += '<option value="' + properties[i].innerText + '">'
                + properties[i].innerText
                + '</option>';
        }
        return html;
    }

//设置连线的label和arrow
    function setlabel(conn) {
        conn.getOverlay("label").setLabel($("#select_source_list").val()
            + ' '
            + $("#select_comparison").val()
            + ' '
            + $("#select_target_list").val());
        if ($("#twoWay").val() == "true") {
            conn.setParameter("twoWay", true);
            if ($("#relationShip").val() == "manyToMany") {
                conn.hideOverlay("arrow_backwards");
                conn.hideOverlay("arrow_forwards");
                conn.showOverlay("multi_arrow_forwards");
                conn.showOverlay("multi_arrow_backwards");
            }
        } else {
            conn.setParameter("twoWay", false);
            conn.hideOverlay("arrow_backwards");
            if ($("#relationShip").val() == "oneToMany") {
                conn.showOverlay("multi_arrow_backwards");
            }
        }
    }

//删除节点
    function removeObjectDiagram(ID) {
        var element = $("#" + ID);
        if (confirm("确定删除该模型？"))
            instance.remove(element);
    }

    //拖拽设置
    $("#object").draggable({
        helper: "clone",
        scope: "plant"
    });
    $("#property").draggable({
        helper: "clone",
        scope: "object"
    });
    $("#container").droppable({
        scope: "plant",
        drop: function (event, ui) {
            createModel(ui, $(this));
        }
    });
    //监听新的连接
    instance.bind("connection", function (connInfo, originalEvent) {
        init(connInfo.connection);
    });
    instance.bind("dblclick", function (conn, originalEvent) {
        if (confirm("要删除从 " + conn.source.getElementsByTagName("span")[0].innerHTML
                + " —— " + conn.target.getElementsByTagName("span")[0].innerHTML + " 的连接么?")) {
            instance.detach(conn);
        }
    });

});

