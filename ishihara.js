'use strict';

function CircleFactory(options) {
  this.options = options;
}

CircleFactory.prototype.generate = function(circular_area) {
  var min_radius = this.options.min_radius;
  var max_radius = this.options.max_radius;
  var radius = min_radius + Math.random() * (max_radius - min_radius);

  if (circular_area) {
    var angle = Math.random() * 2 * Math.PI;
    var distance_from_center = Math.random() * (Math.min(canvas.width, canvas.height) * 0.48 - radius);
    var x = canvas.width  * 0.5 + Math.cos(angle) * distance_from_center;
    var y = canvas.height * 0.5 + Math.sin(angle) * distance_from_center;
  } else {
    var x = radius + Math.random() * (canvas.width  - radius * 2);
    var y = radius + Math.random() * (canvas.height - radius * 2);
  }

  return {x: x, y: y, radius: radius};
};

CircleFactory.prototype.overlaps_image = function(img_data, circle) {
  var x = circle.x;
  var y = circle.y;
  var r = circle.radius;

  var points_x = [x, x, x, x-r, x+r, x-r*0.93, x-r*0.93, x+r*0.93, x+r*0.93];
  var points_y = [y, y-r, y+r, y, y, y+r*0.93, y-r*0.93, y+r*0.93, y-r*0.93];

  for (var i = 0; i < points_x.length; i++) {
    var x = points_x[i];
    var y = points_y[i];

    var index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;

    var r = img_data.data[index];
    var g = img_data.data[index + 1];
    var b = img_data.data[index + 2];
    var a = img_data.data[index + 3];

    if ((r + g + b) * (a / 255) < 127) {
      return true;
    }
  }
  return false;
};

CircleFactory.prototype.intersects = function(circle1, circle2) {
  return Math.pow(circle2.x - circle1.x, 2) +
         Math.pow(circle2.y - circle1.y, 2) <
         Math.pow(circle1.radius + circle2.radius, 2);
};

CircleFactory.prototype.draw = function(ctx, circle) {
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius * this.options.draw_ratio, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
};

function RegularPolygonFactory(options) {
  this.options = options;
}

RegularPolygonFactory.prototype.generate = function(circular_area) {
  var min_radius = this.options.min_radius;
  var max_radius = this.options.max_radius;
  var radius = min_radius + Math.random() * (max_radius - min_radius);

  if (circular_area) {
    var angle = Math.random() * 2 * Math.PI;
    var distance_from_center = Math.random() * (Math.min(canvas.width, canvas.height) * 0.48 - radius);
    var x = canvas.width  * 0.5 + Math.cos(angle) * distance_from_center;
    var y = canvas.height * 0.5 + Math.sin(angle) * distance_from_center;
  } else {
    var x = radius + Math.random() * (canvas.width  - radius * 2);
    var y = radius + Math.random() * (canvas.height - radius * 2);
  }

  var polygon = new Polygon(x, y);
  for (var i = 0; i < this.options.sides; i++) {
    polygon.addPoint({
      x: Math.cos(Math.PI * 2 * (i / this.options.sides)) * radius,
      y: Math.sin(Math.PI * 2 * (i / this.options.sides)) * radius,
    });
  }
  polygon.rotate(Math.random() * 2 * Math.PI);

  return polygon;
};

RegularPolygonFactory.prototype.overlaps_image = function(img_data, polygon) {
  var points = polygon.points.concat({x: polygon.x, y: polygon.y});

  for (var i = 0; i < points.length; i++) {
    var x = points[i].x;
    var y = points[i].y;

    var index = (Math.floor(y) * img_data.width + Math.floor(x)) * 4;

    var r = img_data.data[index];
    var g = img_data.data[index + 1];
    var b = img_data.data[index + 2];
    var a = img_data.data[index + 3];

    if ((r + g + b) * (a / 255) < 127) {
      return true;
    }
  }
  return false;
};

RegularPolygonFactory.prototype.intersects = function(polygon1, polygon2) {
  return polygon1.intersectsWith(polygon2);
};

RegularPolygonFactory.prototype.draw = function(ctx, polygon) {
  ctx.beginPath();
  ctx.moveTo(
    polygon.x + polygon.points[0].x * this.options.draw_ratio,
    polygon.y + polygon.points[0].y * this.options.draw_ratio
  );
  for (var i = 1; i < polygon.points.length; i++) {
    ctx.lineTo(
      polygon.x + polygon.points[i].x * this.options.draw_ratio,
      polygon.y + polygon.points[i].y * this.options.draw_ratio
    );
  }
  ctx.closePath();
  ctx.fill();
};

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var max_width  = window.innerWidth;
  var max_height = window.innerHeight;

  ctx.canvas.width  = max_width;
  ctx.canvas.height = max_height;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var ishihara_input = {
    load_image: function() {
      var image_upload = document.getElementById('image_upload');
      image_upload.click();
    },
    circular: true,
    resize: true,
    invert_colors: false,
    style: 0,
    speed: 100,
    min_radius: (canvas.width + canvas.height) / 600,
    max_radius: (canvas.width + canvas.height) / 150,
    draw_ratio: 1,
    shape_factory: 'Circle',
    sides: 4,
    generate: function() {
      hide_gui_element('generate', true);
      hide_gui_element('clear', true);
      hide_gui_element('stop', false);

      generating = true;

      var circular_area = ishihara_input.circular;
      var invert_colors = ishihara_input.invert_colors;

      var draw_style = Number(ishihara_input.style);

      var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var shape_factory = {
        'Circle': CircleFactory, 'Regular polygon': RegularPolygonFactory
      }[ishihara_input.shape_factory];
      shape_factory = new shape_factory(JSON.parse(JSON.stringify(ishihara_input)));

      var tree = new kdTree([], function(a, b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
      }, ['x', 'y']);

      var failed_in_row = 0;

      var check_nearest = Math.ceil(
        Math.max(ishihara_input.min_radius, ishihara_input.max_radius) /
        Math.min(ishihara_input.min_radius, ishihara_input.max_radius) * 2);

      var step = function() {
        if (!generating) {
          return;
        }
        for (var tries = 0; tries < ishihara_input.speed; tries++) {
          var shape = shape_factory.generate(circular_area);
          var nearest = tree.nearest(shape, check_nearest);

          var intersects = false;

          for (var j = 0; j < nearest.length; j++) {
            var near_shape = nearest[j][0];
            if (shape_factory.intersects(shape, near_shape)) {
              intersects = true;
              break;
            }
          }

          if (intersects) {
            failed_in_row++;
            continue;
          }

          failed_in_row = 0;

          if (shape_factory.overlaps_image(img_data, shape) !== invert_colors) {
            ctx.fillStyle = colors_on[draw_style][Math.floor(Math.random() * colors_on[draw_style].length)];
          } else {
            ctx.fillStyle = colors_off[draw_style][Math.floor(Math.random() * colors_off[draw_style].length)];
          }

          shape_factory.draw(ctx, shape);

          tree.insert(shape);
        }

        if (failed_in_row >= 10000) {
          generating = false;
          hide_gui_element('generate', false);
          hide_gui_element('clear', false);
          hide_gui_element('stop', true);
        } else {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    },
    clear: function() {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    stop: function() {
      generating = false;

      hide_gui_element('generate', false);
      hide_gui_element('clear', false);
      hide_gui_element('stop', true);
    }
  };

  var gui = new dat.GUI();
  gui.add(ishihara_input, 'load_image').name("Load image");
  gui.add(ishihara_input, 'circular').name("Circular");
  gui.add(ishihara_input, 'resize').name("Resize");
  gui.add(ishihara_input, 'invert_colors').name("Invert colors");
  gui.add(ishihara_input, 'shape_factory', ['Circle', 'Regular polygon']).onChange(function(value) {
    hide_gui_element('sides', value !== 'Regular polygon');
  });
  gui.add(ishihara_input, 'sides', 3, 12, 1);
  gui.add(ishihara_input, 'style', {
    'General 1': 0, 'General 2': 1, 'General 3': 2, 'Protanopia': 3,
    'Protanomaly': 4, 'Viewable by all': 5, 'Colorblind only': 6
  }).name("Style");
  gui.add(ishihara_input, 'speed', 10, 1000).name("Speed");
  gui.add(ishihara_input, 'min_radius', 2, 50).name("Min radius").onChange(function() {
    ishihara_input.max_radius = Math.max(ishihara_input.min_radius, ishihara_input.max_radius);
  }).listen();
  gui.add(ishihara_input, 'max_radius', 2, 50).name("Max radius").onChange(function() {
    ishihara_input.min_radius = Math.min(ishihara_input.min_radius, ishihara_input.max_radius);
  }).listen();
  gui.add(ishihara_input, 'draw_ratio', 0, 1, 0.01).name("Draw ratio");
  gui.add(ishihara_input, 'generate').name("Generate");
  gui.add(ishihara_input, 'clear').name("Clear");
  gui.add(ishihara_input, 'stop').name("Stop");

  var hide_gui_element = function(property, hide) {
    for (var i = 0; i < gui.__controllers.length; i++) {
      var controller = gui.__controllers[i];
      if (controller.property === property) {
        controller.domElement.parentElement.parentElement.hidden = hide;
        return;
      }
    }
  };

  hide_gui_element('sides', true);
  hide_gui_element('stop', true);

  var colors_on = [
    ['#F9BB82', '#EBA170', '#FCCD84'],
    ['#89B270', '#7AA45E', '#B6C674', '#7AA45E', '#B6C674'],
    ['#89B270', '#7AA45E', '#B6C674', '#7AA45E', '#B6C674', '#FECB05'],
    ['#E96B6C', '#F7989C'],
    ['#AD5277', '#F7989C'],
    ['#FF934F'],
    ['#A8AA00', '#83BE28']
  ];
  var colors_off =  [
    ['#9CA594', '#ACB4A5', '#BBB964', '#D7DAAA', '#E5D57D', '#D1D6AF'],
    ['#F49427', '#C9785D', '#E88C6A', '#F1B081'],
    ['#F49427', '#C9785D', '#E88C6A', '#F1B081', '#FFCE00'],
    ['#635A4A', '#817865', '#9C9C84'],
    ['#635A4A', '#817865', '#9C9C84'],
    ['#9C9C9C'],
    ['#828200', '#669A1B', '#828200', '#669A1B', '#ED6311']
  ];

  var painting = false;
  var generating = false;
  var x, y;

  canvas.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
      painting = true;

      x = e.pageX - this.offsetLeft;
      y = e.pageY - this.offsetTop;

      if (generating) return;

      ctx.beginPath();
      ctx.fillStyle = e.ctrlKey ? '#FFF' : '#000';
      ctx.arc(x, y, 7.25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
  });
  canvas.addEventListener('mouseup', function(e) {
    if (e.button === 0) {
      painting = false;

      x = e.pageX - this.offsetLeft;
      y = e.pageY - this.offsetTop;

      if (generating) return;

      ctx.beginPath();
      ctx.fillStyle = e.ctrlKey ? '#FFF' : '#000';
      ctx.arc(x, y, 7.25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!painting || generating) return;
    var curr_x = e.pageX - this.offsetLeft;
    var curr_y = e.pageY - this.offsetTop;

    ctx.beginPath();
    ctx.strokeStyle = e.ctrlKey ? '#FFF' : '#000';
    ctx.moveTo(x, y);
    ctx.lineWidth = 15;
    ctx.lineTo(curr_x, curr_y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = e.ctrlKey ? '#FFF' : '#000';
    ctx.arc(x, y, 7.25, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    x = curr_x;
    y = curr_y;
  });

  image_upload.addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        if (ishihara_input.resize) {
          var ratio = Math.min(max_width / img.width, max_height / img.height);
          canvas.width  = img.width  * ratio;
          canvas.height = img.height * ratio;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };
    reader.readAsDataURL(e.target.files[0]);
  }, false);
});
