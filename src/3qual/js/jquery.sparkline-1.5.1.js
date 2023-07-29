(function($){$.fn.simpledraw=function(width,height,use_existing){if(use_existing&&this[0].vcanvas){return this[0].vcanvas;}if(width==undefined){width=$(this).innerWidth();}if(height==undefined){height=$(this).innerHeight();}if($.browser.hasCanvas){return new vcanvas_canvas(width,height,this);}else{if($.browser.msie){return new vcanvas_vml(width,height,this);}else{return false;}}};var pending=[];$.fn.sparkline=function(uservalues,options){var options=$.extend({type:"line",lineColor:"#00f",fillColor:"#cdf",defaultPixelsPerValue:3,width:"auto",height:"auto",composite:false},options?options:{});return this.each(function(){var render=function(){var values=(uservalues=="html"||uservalues==undefined)?$(this).text().split(","):uservalues;var width=options.width=="auto"?values.length*options.defaultPixelsPerValue:options.width;if(options.height=="auto"){if(!options.composite||!this.vcanvas){var tmp=document.createElement("span");tmp.innerHTML="a";$(this).html(tmp);height=$(tmp).innerHeight();$(tmp).remove();}}else{height=options.height;}$.fn.sparkline[options.type].call(this,values,options,width,height);};if(($(this).html()&&$(this).is(":hidden"))||($.fn.jquery<"1.3.0"&&$(this).parents().is(":hidden"))){pending.push([this,render]);}else{render.call(this);}});};$.sparkline_display_visible=function(){for(var i=pending.length-1;i>=0;i--){var el=pending[i][0];if($(el).is(":visible")&&!$(el).parents().is(":hidden")){pending[i][1].call(el);pending.splice(i,1);}}};$.fn.sparkline.bar=function(values,options,width,height){var options=$.extend({type:"bar",barColor:"#00f",negBarColor:"#f44",zeroColor:undefined,nullColor:undefined,zeroAxis:undefined,barWidth:4,barSpacing:1,chartRangeMax:undefined,chartRangeMin:undefined,chartRangeClip:false,colorMap:undefined},options?options:{});var width=(values.length*options.barWidth)+((values.length-1)*options.barSpacing);var num_values=[];for(var i=0,vlen=values.length;i<vlen;i++){if(values[i]=="null"||values[i]===null){values[i]=null;}else{values[i]=Number(values[i]);num_values.push(Number(values[i]));}}var max=Math.max.apply(Math,num_values);var min=Math.min.apply(Math,num_values);if(options.chartRangeMin!=undefined&&(options.chartRangeClip||options.chartRangeMin<min)){min=options.chartRangeMin;}if(options.chartRangeMax!=undefined&&(options.chartRangeClip||options.chartRangeMax>max)){max=options.chartRangeMax;}if(options.zeroAxis==undefined){options.zeroAxis=min<0;}var range=max-min==0?1:max-min;if($.isArray(options.colorMap)){var colorMapByIndex=options.colorMap;var colorMapByValue=null;}else{var colorMapByIndex=null;var colorMapByValue=options.colorMap;}var target=$(this).simpledraw(width,height,options.composite);if(target){var canvas_width=target.pixel_width;var canvas_height=target.pixel_height;var yzero=min<0&&options.zeroAxis?canvas_height-Math.round(canvas_height*(Math.abs(min)/range))-1:canvas_height-1;for(var i=0,vlen=values.length;i<vlen;i++){var x=i*(options.barWidth+options.barSpacing);var val=values[i];if(val===null){if(options.nullColor){color=options.nullColor;val=(options.zeroAxis&&min<0)?0:min;var height=1;var y=(options.zeroAxis&&min<0)?yzero:canvas_height-height;}else{continue;}}else{if(val<min){val=min;}if(val>max){val=max;}var color=(val<0)?options.negBarColor:options.barColor;if(options.zeroAxis&&min<0){var height=Math.round(canvas_height*((Math.abs(val)/range)))+1;var y=(val<0)?yzero:yzero-height;}else{var height=Math.round(canvas_height*((val-min)/range))+1;var y=canvas_height-height;}if(val==0&&options.zeroColor!=undefined){color=options.zeroColor;}if(colorMapByValue&&colorMapByValue[val]){color=colorMapByValue[val];}else{if(colorMapByIndex&&colorMapByIndex.length>i){color=colorMapByIndex[i];}}if(color===null){continue;}}target.drawRect(x,y,options.barWidth-1,height-1,color,color);}}else{this.innerHTML="";}};if($.browser.msie&&!document.namespaces["v"]){document.namespaces.add("v","urn:schemas-microsoft-com:vml","#default#VML");}if($.browser.hasCanvas==undefined){var t=document.createElement("canvas");$.browser.hasCanvas=t.getContext!=undefined;}var vcanvas_base=function(width,height,target){};vcanvas_base.prototype={init:function(width,height,target){this.width=width;this.height=height;this.target=target;if(target[0]){target=target[0];}target.vcanvas=this;},drawShape:function(path,lineColor,fillColor,lineWidth){alert("drawShape not implemented");},drawLine:function(x1,y1,x2,y2,lineColor,lineWidth){return this.drawShape([[x1,y1],[x2,y2]],lineColor,lineWidth);},drawCircle:function(x,y,radius,lineColor,fillColor){alert("drawCircle not implemented");},drawPieSlice:function(x,y,radius,startAngle,endAngle,lineColor,fillColor){alert("drawPieSlice not implemented");},drawRect:function(x,y,width,height,lineColor,fillColor){alert("drawRect not implemented");},getElement:function(){return this.canvas;},_insert:function(el,target){$(target).html(el);}};var vcanvas_canvas=function(width,height,target){return this.init(width,height,target);};vcanvas_canvas.prototype=$.extend(new vcanvas_base,{_super:vcanvas_base.prototype,init:function(width,height,target){this._super.init(width,height,target);this.canvas=document.createElement("canvas");if(target[0]){target=target[0];}target.vcanvas=this;$(this.canvas).css({display:"inline-block",width:width,height:height,verticalAlign:"top"});this._insert(this.canvas,target);this.pixel_height=$(this.canvas).height();this.pixel_width=$(this.canvas).width();this.canvas.width=this.pixel_width;this.canvas.height=this.pixel_height;$(this.canvas).css({width:this.pixel_width,height:this.pixel_height});},_getContext:function(lineColor,fillColor,lineWidth){var context=this.canvas.getContext("2d");if(lineColor!=undefined){context.strokeStyle=lineColor;}context.lineWidth=lineWidth==undefined?1:lineWidth;if(fillColor!=undefined){context.fillStyle=fillColor;}return context;},drawShape:function(path,lineColor,fillColor,lineWidth){var context=this._getContext(lineColor,fillColor,lineWidth);context.beginPath();context.moveTo(path[0][0]+0.5,path[0][1]+0.5);for(var i=1,plen=path.length;i<plen;i++){context.lineTo(path[i][0]+0.5,path[i][1]+0.5);}if(lineColor!=undefined){context.stroke();}if(fillColor!=undefined){context.fill();}},drawCircle:function(x,y,radius,lineColor,fillColor){var context=this._getContext(lineColor,fillColor);context.beginPath();context.arc(x,y,radius,0,2*Math.PI,false);if(lineColor!=undefined){context.stroke();}if(fillColor!=undefined){context.fill();}},drawPieSlice:function(x,y,radius,startAngle,endAngle,lineColor,fillColor){var context=this._getContext(lineColor,fillColor);context.beginPath();context.moveTo(x,y);context.arc(x,y,radius,startAngle,endAngle,false);context.lineTo(x,y);context.closePath();if(lineColor!=undefined){context.stroke();}if(fillColor){context.fill();}},drawRect:function(x,y,width,height,lineColor,fillColor){return this.drawShape([[x,y],[x+width,y],[x+width,y+height],[x,y+height],[x,y]],lineColor,fillColor);}});var vcanvas_vml=function(width,height,target){return this.init(width,height,target);};vcanvas_vml.prototype=$.extend(new vcanvas_base,{_super:vcanvas_base.prototype,init:function(width,height,target){this._super.init(width,height,target);if(target[0]){target=target[0];}target.vcanvas=this;this.canvas=document.createElement("span");$(this.canvas).css({display:"inline-block",position:"relative",overflow:"hidden",width:width,height:height,margin:"0px",padding:"0px",verticalAlign:"top"});this._insert(this.canvas,target);this.pixel_height=$(this.canvas).height();this.pixel_width=$(this.canvas).width();this.canvas.width=this.pixel_width;this.canvas.height=this.pixel_height;var groupel='<v:group coordorigin="0 0" coordsize="'+this.pixel_width+" "+this.pixel_height+'"'+' style="position:absolute;top:0;left:0;width:'+this.pixel_width+"px;height="+this.pixel_height+'px;"></v:group>';this.canvas.insertAdjacentHTML("beforeEnd",groupel);this.group=$(this.canvas).children()[0];},drawShape:function(path,lineColor,fillColor,lineWidth){var vpath=[];for(var i=0,plen=path.length;i<plen;i++){vpath[i]=""+(path[i][0])+","+(path[i][1]);}var initial=vpath.splice(0,1);lineWidth=lineWidth==undefined?1:lineWidth;var stroke=lineColor==undefined?' stroked="false" ':' strokeWeight="'+lineWidth+'" strokeColor="'+lineColor+'" ';var fill=fillColor==undefined?' filled="false"':' fillColor="'+fillColor+'" filled="true" ';var closed=vpath[0]==vpath[vpath.length-1]?"x ":"";var vel='<v:shape coordorigin="0 0" coordsize="'+this.pixel_width+" "+this.pixel_height+'" '+stroke+fill+' style="position:absolute;left:0px;top:0px;height:'+this.pixel_height+"px;width:"+this.pixel_width+'px;padding:0px;margin:0px;" '+' path="m '+initial+" l "+vpath.join(", ")+" "+closed+'e">'+" </v:shape>";this.group.insertAdjacentHTML("beforeEnd",vel);},drawCircle:function(x,y,radius,lineColor,fillColor){x-=radius+1;y-=radius+1;var stroke=lineColor==undefined?' stroked="false" ':' strokeWeight="1" strokeColor="'+lineColor+'" ';var fill=fillColor==undefined?' filled="false"':' fillColor="'+fillColor+'" filled="true" ';var vel="<v:oval "+stroke+fill+' style="position:absolute;top:'+y+"px; left:"+x+"px; width:"+(radius*2)+"px; height:"+(radius*2)+'px"></v:oval>';this.group.insertAdjacentHTML("beforeEnd",vel);},drawPieSlice:function(x,y,radius,startAngle,endAngle,lineColor,fillColor){if(startAngle==endAngle){return;}if((endAngle-startAngle)==(2*Math.PI)){startAngle=0;endAngle=(2*Math.PI);}var startx=x+Math.round(Math.cos(startAngle)*radius);var starty=y+Math.round(Math.sin(startAngle)*radius);var endx=x+Math.round(Math.cos(endAngle)*radius);var endy=y+Math.round(Math.sin(endAngle)*radius);if(startx==endx&&starty==endy&&(endAngle-startAngle)<Math.PI){return;}var vpath=[x-radius,y-radius,x+radius,y+radius,startx,starty,endx,endy];var stroke=lineColor==undefined?' stroked="false" ':' strokeWeight="1" strokeColor="'+lineColor+'" ';var fill=fillColor==undefined?' filled="false"':' fillColor="'+fillColor+'" filled="true" ';var vel='<v:shape coordorigin="0 0" coordsize="'+this.pixel_width+" "+this.pixel_height+'" '+stroke+fill+' style="position:absolute;left:0px;top:0px;height:'+this.pixel_height+"px;width:"+this.pixel_width+'px;padding:0px;margin:0px;" '+' path="m '+x+","+y+" wa "+vpath.join(", ")+' x e">'+" </v:shape>";this.group.insertAdjacentHTML("beforeEnd",vel);},drawRect:function(x,y,width,height,lineColor,fillColor){return this.drawShape([[x,y],[x,y+height],[x+width,y+height],[x+width,y],[x,y]],lineColor,fillColor);}});})(jQuery);