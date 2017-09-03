# ali-img

阿里云图片处理工具包

### Usage

```bash
npm i -S ali-img
```

```javascript

```

### Img 实例方法

- [resize 调整尺寸大小](#resize)
- [circle 内切圆](#circle)
- [crop 裁剪](#crop)
- [indexCrop 索引切割](#indexcrop)
- [roundedCorners 圆角矩形](#roundedcorners)
- [autoOrient 自适应方向](autoorient)
- [rotate 旋转](#rotate)
- [blur 模糊效果](#blur)
- [bright 调整图片亮度](#bright)
- [contrast 调整图片对比度](#contrast)
- [sharpen 锐化图片](#sharpen)
- [format 图片输出格式](#format)
- [interlace 渐进显示](#interlace)
- [watermark 打上图片水印](#watermark)
- [drawText 绘制文字](#drawtext)
- [fill 设置填充颜色](#fill)
- [font 设置文字字体](#font)
- [fontSize 设置文字大小](#fontsize)

### resize

调整图片尺寸大小。

`resize(width, height [, options])`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| width | number & null | 是 | 图片宽度 |
| height | number & null | 是 | 图片高度 |
| options | object | 否 | 其他选项 |

### options 对象属性

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| limit | number | 指定当目标缩略图大于原图时是否处理。<br/>值是 1 表示不处理；值是 0 表示处理。默认是 0 |
| mode | string | 指定缩略的模式：<br/>- lfit：等比缩放，限制在设定在指定w与h的矩形内的最大图片。<br/>- mfit：等比缩放，延伸出指定w与h的矩形框外的最小图片。<br/>- fill：固定宽高，将延伸出指定w与h的矩形框外的最小图片进行居中裁剪。<br/>- pad：固定宽高，缩略填充。<br/>- fixed：固定宽高，强制缩略 |
| color | string | 当缩放模式选择为pad（缩略填充）时，可以选择填充的颜色(默认是白色)参数的填写方式：采用16进制颜色码表示，如00FF00（绿色）。|
| percent | number | 倍数百分比。 小于100，即是缩小，大于100即是放大。 此参数存在则覆盖`width`和`height`属性 |

### circle

图片内切圆。

`circle(radius)`

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| radius | number | 是 | 从图片取出的圆形区域的半径<br/>半径 r 不能超过原图的最小边的一半。<br/>如果超过，则圆的大小仍然是原圆的最大内切圆。 |

#### 注意事项

> - 如果图片的最终格式是 png、webp、 bmp 等支持透明通道的图片，那么图片非圆形区域的地方将会以透明填充。<br/>如果图片的最终格式是 jpg，那么非圆形区域是以白色进行填充。推荐保存成 png 格式。
> - 如果指定半径大于原图最大内切圆的半径，则圆的大小仍然是图片的最大内切圆。

### crop

裁剪图片,指定裁剪的起始点以及裁剪的宽高来决定裁剪的区域。

`crop(x, y, width, height [, origin])`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| x | number | 是 | 指定裁剪起点横坐标（默认左上角为原点） |
| y | number | 是 | 指定裁剪起点纵坐标（默认左上角为原点） |
| width | number | 是 | 指定裁剪宽度 |
| height | number | 是 | 指定裁剪高度 |
| origin | string | 否 | 设置裁剪的原点位置，由九宫格的格式，一共有九个地方可以设置，每个位置位于每个九宫格的左上角 |

#### 裁剪原点位置参数示意图：

| nw | north | ne |
| :---: | :---: | :---: |
| west | center | east |
| sw | south | se |

#### 注意事项

> 如果指定的起始横纵坐标大于原图，将会返回错误：BadRequest, 错误内容是：Advance cut’s position is out of image. <br/>如果从起点开始指定的宽度和高度超过了原图，将会直接裁剪到原图结尾。

### indexCrop

索引切割。将图片分成 x，y 轴，按指定长度 (length) 切割，指定索引 (index)，取出指定的区域。

`indexCrop(x, y, index)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| x | number | 特殊否 | 进行水平切割，每块图片的长度。x 参数与 y 参数只能任选其一。 |
| y | number | 特殊否 | 进行垂直切割，每块图片的长度。x 参数与 y 参数只能任选其一。 |
| index | number | 是 | 选择切割后第几个块。（0表示第一块）<br/>如果超出最大块数，返回原图。 |

### roundedCorners

可以把图片保存成圆角矩形，并可以指定圆角的大小 。

`roundedCorners(radius)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| radius | number | 是 | 将图片切出圆角，指定圆角的半径。<br/>生成的最大圆角的半径不能超过原图的最小边的一半。 |

#### 注意事项

> - 如果图片的最终格式是 png、webp、bmp 等支持透明通道的图片，那么图片非圆形区域的地方将会以透明填充。如果图片的最终格式是 jpg， 那么非圆形区域是以白色进行填充 。推荐保存成 png 格式。
> - 如果指定半径大于原图最大内切圆的半径，则圆角的大小仍然是图片的最大内切圆。

### autoOrient

自适应方向。某些手机拍摄出来的照片可能带有旋转参数（存放在照片exif信息里面）。可以设置是否对这些图片进行旋转。默认是设置自适应方向。

`autoOrient(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 进行自动旋转<br/>0：表示按原图默认方向，不进行自动旋转。<br/>1：先进行图片进行旋转，然后再进行缩略 |

#### 注意事项

> - 进行自适应方向旋转，要求原图的宽度和高度必须小于 4096。
> - 如果原图没有旋转参数，加上auto-orient参数不会对图有影响。

### rotate

可以将图片按顺时针旋转。

`rotate(angle)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| angle | number | 是 | 图片按顺时针旋转的角度。默认值为 0，表示不旋转。 |

#### 注意事项

> - 旋转图片可能会导致图片的尺寸变大。
> - 旋转对图片的尺寸有限制，图片的宽或者高不能超过 4096。

### blur

可以对图片进行模糊操作。

`blur(radius, standard)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| radius | number | 是 | 模糊半径。取值[1,50]<br/>r 越大图片越模糊。 |
| standard | number | 是 | 正态分布的标准差。取值[1,50]<br/>s 越大图片越模糊。 |

### bright

可以对处理后的图片进行亮度调节。

`bright(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 亮度调整。0 表示原图亮度，小于 0 表示低于原图亮度，大于 0 表示高于原图亮度。取值[-100, 100] |

### contrast

可以对处理后的图片进行对比度调节。

`contrast(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 对比度调整。0 表示原图对比度，小于 0 表示低于原图对比度，大于 0 表示高于原图对比度。取值[-100, 100] |

### sharpen

可以对处理后的图片进行锐化，使图片变得清晰。

`sharpen(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 表示进行锐化处理。取值为锐化参数，参数越大，越清晰。取值[50, 399]。为达到较优效果，推荐取值为 100。 |

### format

可以将图片转换成对应格式(jpg, png, bmp, webp，gif)。 默认不填格式，是按原图格式返回。

`format(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | string | 是 | 指定输出的图片格式，可选`jpg`,`png`,`bmp`,`webp`,`gif` |

### interlace

图片格式为 jpg 时有两种呈现方式：
- 自上而下的扫描式
- 先模糊后逐渐清晰（在网络环境比较差时明显）

默认保存为第一种，如果要指定先模糊后清晰的呈现方式，请使用渐进显示参数。

`interlace(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 1 表示保存成渐进显示的 jpg 格式<br/>0 表示保存成普通的 jpg 格式 |

> 注意：此参数只有当效果图是 jpg 格式时才有意义 。

### watermark

打上图片水印

`watermark(x, y, image [, options])`

### drawText

绘制文字

`drawText(x, y, text [, options])`

### fill

设置填充颜色

`fill(color)`

### font

设置文字字体

`font(name)`

### fontSize

设置文字大小

`fontSize(size)`
