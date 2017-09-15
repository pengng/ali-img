# ali-img

Ali cloud image processing tool package

### Usage

```bash
npm i -S ali-img
```

```javascript
const fs = require('fs')
const AliImg = require('ali-img')

const img = new AliImg({
  accessKeyId: '',
  accessKeySecret: '',
  region: '',
  bucket: ''
})

img('test.png')
  .drawText(100, 100, '测试')
  .format('png')
  .resize(400, 400)
  .stream()
  .pipe(fs.createWriteStream('save.png'))

```

## img 工厂方法

可传入`本地图片`或`网络图片`路径，返回`Img`实例。

```javascript
const localImg = img('/path/to/resource.png')
const networkImg = img('https://path/to/resource.png')
```

### Img 实例方法

- 图片缩放
  - [resize 图片缩放](#resize)
- 图片裁剪
  - [circle 内切圆](#circle)
  - [crop 裁剪](#crop)
  - [indexCropX 索引切割(横向)](#indexcropx)
  - [indexCropY 索引切割(纵向)](#indexcropy)
  - [roundedCorners 圆角矩形](#roundedcorners)
- 图片旋转
  - [autoOrient 自适应方向](#autoorient)
  - [rotate 旋转](#rotate)
- 图片效果
  - [blur 模糊效果](#blur)
  - [bright 亮度](#bright)
  - [contrast 对比度](#contrast)
  - [sharpen 锐化](#sharpen)
- 格式转换
  - [format 格式转换](#format)
  - [interlace 渐进显示](#interlace)
  - [quality 质量变换(相对)](#quality)
  - [absoluteQuality 质量变换(绝对)](#absolutequality)
- 图片水印
  - [watermark 图片水印](#watermark)
  - [drawText 绘制文字](#drawtext)
  - [fill 填充颜色](#fill)
  - [font 文字字体](#font)
  - [fontSize 文字大小](#fontsize)
- 生成
  - [stream 返回图片流](#stream)
  - [toBuffer 取得图片Buffer对象](#tobuffer)
  - [write 写入本地文件](#write)

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

### indexCropX

索引切割（横向）。将图片分成 x 轴，按指定长度 (length) 切割，指定索引 (index)，取出指定的区域。

`indexCropX(width, index)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| width | number | 是 | 进行水平切割，每块图片的宽度。 |
| index | number | 是 | 选择切割后第几个块。（0表示第一块）<br/>如果超出最大块数，返回原图。 |

### indexCropY

索引切割（纵向）。将图片分成 y 轴，按指定长度 (length) 切割，指定索引 (index)，取出指定的区域。

`indexCropY(height, index)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| height | number | 是 | 进行垂直切割，每块图片的高度。 |
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

### quality

如果图片保存成 jpg 或 webp, 可以支持质量变换。

`quality(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 决定图片的相对质量，对原图按照 q% 进行质量压缩。如果原图质量是 100%，使用 90q 会得到质量为 90％ 的图片；如果原图质量是 80%，使用 90q 会得到质量72%的图片。 <br/>只能在原图是 jpg 格式的图片上使用，才有相对压缩的概念。如果原图为 webp，那么相对质量就相当于绝对质量。 |

### absoluteQuality

如果图片保存成 jpg 或 webp, 可以支持质量变换。

`absoluteQuality(value)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| value | number | 是 | 决定图片的绝对质量，把原图质量压到Q%，如果原图质量小于指定数字，则不压缩。如果原图质量是100%，使用”90Q”会得到质量90％的图片；如果原图质量是95%，使用“90Q”还会得到质量90%的图片；如果原图质量是80%，使用“90Q”不会压缩，返回质量80%的原图。 <br/>只能在保存格式为jpg/webp效果上使用，其他格式无效果。 如果同时指定了q和Q，按Q来处理。 |

### watermark

图片水印。水印操作可以在图片上设置另外一张图片做为水印。

`watermark(x, y, image [, options])`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| x | number | 是 | 参数意义：水平边距, 就是距离图片边缘的水平距离， 这个参数只有当水印位置是左上，左中，左下， 右上，右中，右下才有意义<br/>默认值：10 <br/>取值范围：[0 – 4096] <br/>单位：像素（px） |
| y | number | 是 | 参数意义：垂直边距, 就是距离图片边缘的垂直距离， 这个参数只有当水印位置是左上，中上， 右上，左下，中下，右下才有意义<br/>默认值：10 <br/>取值范围：[0 – 4096] <br/>单位：像素(px) |
| image | object | 是 | AliImage 实例 |
| options | object | 否 | 选项对象 |

### options 对象属性

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| position | string | 参数意义：位置，水印打在图的位置，详情参考下方区域数值对应图。<br/>取值范围：[nw,north,ne,west,center,east,ne,south] |
| transparency | number | 参数意义：透明度。<br/>默认值：100， 表示 100%（不透明） 取值范围: [0-100] |
| voffset | number | 参数意义： 中线垂直偏移，当水印位置在左中，中部，右中时，可以指定水印位置根据中线往上或者往下偏移。 <br/>默认值：0 <br/>取值范围：[-1000, 1000] <br/>单位：像素(px) |

#### 注意事项

> 水平边距、垂直边距、中线垂直偏移不仅可以调节水印在图片中的位置，而且当图片存在多重水印时，也可以调节两张水印在图中的布局。
用到的URL安全的Base64位编码可以参考文档下方的解释。
区域数值以及每个区域对应的基准点如下图。

| nw | north | ne |
| :---: | :---: | :---: |
| west | center | east |
| sw | south | se |

### drawText

绘制文字

`drawText(x, y, text [, options])`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| x | number | 是 | 参数意义：水平边距, 就是距离图片边缘的水平距离， 这个参数只有当水印位置是左上，左中，左下， 右上，右中，右下才有意义<br/>默认值：10 <br/>取值范围：[0 – 4096] <br/>单位：像素（px） |
| y | number | 是 | 参数意义：垂直边距, 就是距离图片边缘的垂直距离， 这个参数只有当水印位置是左上，中上， 右上，左下，中下，右下才有意义<br/>默认值：10 <br/>取值范围：[0 – 4096] <br/>单位：像素(px) |
| text | string | 是 | 文字内容 |
| options | object | 否 | 选项对象 |

### options 对象属性

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| position | string | 参数意义：位置，水印打在图的位置，详情参考下方区域数值对应图。<br/>取值范围：[nw,north,ne,west,center,east,ne,south] |
| transparency | number | 参数意义：透明度。<br/>默认值：100， 表示 100%（不透明） 取值范围: [0-100] |
| voffset | number | 参数意义： 中线垂直偏移，当水印位置在左中，中部，右中时，可以指定水印位置根据中线往上或者往下偏移。 <br/>默认值：0 <br/>取值范围：[-1000, 1000] <br/>单位：像素(px) |
| shadow | number | 参数意义：文字水印的阴影透明度 <br/>取值范围：(0,100] |
| rotate | number | 参数意义：文字顺时针旋转角度 <br/>取值范围：[0,360] |
| fill | number | 参数意义：进行水印铺满的效果；<br/>取值范围：[0,1]，1表示铺满，0表示效果无效 |

### fill

设置填充颜色

`fill(color)`

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| color | string | 是 | 参数意义：文字水印文字的颜色 <br/>参数的构成必须是：六个十六进制数 如：000000表示黑色。 000000每两位构成RGB颜色，FFFFFF表示的是白色 <br/>默认值：000000黑色 |

### font

设置文字字体

`font(name)`

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| name | string | 是 | 参数意义：表示文字水印的文字类型<br/>取值范围：见下表（文字类型编码对应表） <br/>默认值：wqy-zenhei<br/>可输入参数对应的中文 |

### 文字类型编码对应表

| 参数值 | 中文意思 |
| --- | --- |
| wqy-zenhei | 文泉驿正黑 |
| wqy-microhei | 文泉微米黑 |
| fangzhengshusong | 方正书宋 |
| fangzhengkaiti | 方正楷体 |
| fangzhengheiti | 方正黑体 |
| fangzhengfangsong | 方正仿宋 |
| droidsansfallback | DroidSansFallback |

### fontSize

设置文字大小

`fontSize(size)`

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| size | number | 是 | 参数意义：文字水印文字大小(px) <br/>取值范围：(0，1000] <br/>默认值：40 |

### stream

获取图片流

`stream()`

返回图片流

### toBuffer

获取图片Buffer

`toBuffer(callback)`

### 回调函数内参数

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| err | object | 错误对象 |
| buffers | buffer | 图片buffer数据 |

### write

写入本地文件

`write(fullpath, callback)`

### 参数

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| fullpath | string | 是 | 写入路径 |
| callback | function | 是 | 回调函数 |

### 回调函数内参数

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| err | object | 错误对象 |