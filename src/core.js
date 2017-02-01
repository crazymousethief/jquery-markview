(function ($) {
    var _loader = function (url) {
            var dfd = $.Deferred();
            $.ajax({
                url: url,
                success: function (data) {
                    dfd.resolve(data);
                }
            });
            return dfd.promise();
        },
        _parser = function (data) {
            var pattern = /^[ ]*(\#+)[ ]+(\S+)[ ]*\#*$/gm;

            var stack = [],
                dataBlock = [];
            for (var match = pattern.exec(data), index = 0; match !== null; match = pattern.exec(data)) {
                dataBlock.push(data.substring(index, match.index));
                index = match.index;
                stack.push({
                    level: match[1].length,
                    title: match[2],
                    childNodes: []
                });
            }
            dataBlock.push(data.substring(index, data.length));
            for (var i = 0; i < dataBlock.length; i++) {
                var str = dataBlock[i];
                dataBlock[i] = str.substring(str.indexOf('\n') + 1, str.length - 1);
            }
            dataBlock.reverse();
            dataBlock.pop();
            stack.reverse();

            return (function parse(parent, level) {
                while (stack.length) {
                    var node = stack[stack.length - 1];
                    if (node.level > level) {
                        parent.push($.extend(stack.pop(), {
                            data: dataBlock.pop()
                        }));
                        parse(node.childNodes, node.level);
                    } else {
                        return parent;
                    }
                }
                return parent;
            }([], 0));
        };
    $.fn.markview = function (options) {
        var settings = $.extend({
            'url': 'README.md',
            'style': 'fold'
        }, options);
        return this.each(function () {
            var $this = $(this);
            _loader(settings.url)
                .then(function (data) {
                    (function build($parent, data) {
                        if (data.length !== 0) {
                            data.forEach(function (element) {
                                var $newDiv = build($('<div>'), element.childNodes).toggle();
                                $parent.append(
                                    $('<h' + element.level + '>').text(element.title)
                                    .attr("style", $newDiv[0].childNodes.length === 0 ? "" : "cursor:pointer")
                                    .click(function () {
                                        $newDiv.slideToggle("fast");
                                    }), $newDiv[0].childNodes.length === 0 ? null : $newDiv
                                );
                            }, this);
                        }
                        return $parent;
                    }($this, _parser(data)));
                });
        });
    };
}(jQuery));