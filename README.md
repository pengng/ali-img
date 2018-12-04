# ali-img

阿里云图像处理工具包

### Usage

```bash
npm i ali-img -S
```

```javascript
const AliImg = require('ali-img')

let img = new AliImg({
	accessKeyId: 'xxx',
	accessKeySecret: 'xxx',
	region: 'oss-cn-shenzhen',
	bucket: 'bucket name'
})

img('test.png').watermark('Hello world').write('save.png')
```



### new AliImg(opt)

- `opt` \<Object\> 配置对象
  - `accessKeyId` \<string\> 阿里云账户accessKeyId
  - `accessKeySecret` \<string\> 阿里云账户accessKeySecret
  - `region` \<string\> oss bucket 所属区域，如 **oss-cn-shenzhen**
  - `bucket` \<string\> oss bucket 名称

传入配置对象，返回 `Img` 工厂方法。

```javascript
let img = new AliImg({
	accessKeyId: 'xxx',
	accessKeySecret: 'xxx',
	region: 'oss-cn-shenzhen',
	bucket: 'bucket name'
})
```



### img 工厂方法

可传入`本地图片`或`网络图片`路径或 `Readable` 实例，返回`Img`实例。

```javascript
const localImg = img('/path/to/resource.png')
const networkImg = img('https://path/to/resource.png')
const readableImg = img(http.get('http://path/to/resource.png'))
```



### Img 实例方法

- 图片缩放
  - [resize](#resizeopt) 图片缩放

- 图片裁剪
  - [circle](#circleradius) 内切圆
  - [crop](#cropx-y-width-height-origin) 裁剪
  - [indexCrop](#indexcropopt) 索引切割
  - [roundedCorners](#roundedcornersradius) 圆角矩形

- 图片旋转
  - [autoOrient](#autoorientvalue) 自适应方向
  - [rotate](#rotateangle) 旋转角度

- 图片效果
  - [blur](#blurradius-standard) 模糊效果
  - [bright](#brightbrightness) 图片亮度
  - [contrast](#contrastvalue) 图片对比度
  - [sharpen](#sharpenvalue) 图片锐化

- 格式转换
  - [format](#formattype) 格式转换
  - [interlace](#interlacetype) 渐进显示
  - [quality](#qualityvalue) 质量变换(相对)
  - [absQual](#absqualvalue) 质量变换(绝对)

- 图片水印
  - [watermark](#watermarkcontent-opt) 图片水印

- 文字效果
  - [fill](#fillcolor) 填充颜色
  - [font](#fontname) 文字字体
  - [fontSize](#fontsizesize) 文字大小
  - [textShadow](#textshadowtransparency) 文字阴影透明度
  - [textRotate](#textrotateangle) 文字的旋转角度

- 生成
  - [save](#savepath) 将处理后的图片保存阿里云OSS，获取保存后的图片URL
  - [stream](#stream) 获取处理后图片的数据流
  - [toBuffer](#tobuffer) 获取处理后图片的二进制数据
  - [write](#writefullpath) 将处理后的图片写入本地文件



### resize(opt)

- `opt` \<Object\>
  - `width` \<number\> 图片宽度
  - `height` \<number\> 图片高度
  - `longest` \<number\> 指定目标缩略图的最长边。
  - `shortest` \<number\> 指定目标缩略图的最短边。
  - `limit` \<number\> 指定当目标缩略图大于原图时是否处理。值是 1 表示不处理；值是 0 表示处理。默认是 0
  - `mode` \<string\> 指定缩略的模式。**lfit**：等比缩放，限制在设定在指定 width 与 height 的矩形内的最大图片。**mfit**：等比缩放，延伸出指定 width 与 height 的矩形框外的最小图片。**fill**：固定宽高，将延伸出指定 width 与 height 的矩形框外的最小图片进行居中裁剪。**pad**：固定宽高，缩略填充。**fixed**：固定宽高，强制缩略。**Img** 类的静态属性 **RESIZE_MODE** 保存了所有支持的缩略模式。
  - `color` \<string\> 当缩放模式选择为pad（缩略填充）时，可以选择填充的颜色(默认是白色)参数的填写方式：采用16进制颜色码表示，如00FF00（绿色）。
  - `percent` \<number\> 倍数百分比。 小于100，即是缩小，大于100即是放大。 此参数存在则覆盖`width`和`height`属性

调整图片尺寸大小。调用 **resize**，默认是不允许放大。即如果请求的图片对原图大，那么返回的仍然是原图。如果想取到放大的图片，即增加参数调用 **limit** 。对于缩略图：对缩略后的图片大小有限制，目标缩略图宽与高的乘积不能超过 4096 x 4096，且单边长度不能超过 4096 x 4。当只指定宽度或者高度时，在等比缩放的情况下，都会默认进行单边的缩放。在固定宽高的模式下，会默认宽高一样的情况下进行缩略。

```javascript
// 图片缩放
img('/path/to/img.png').resize({width: 200, height: 200}).write('/path/to/save.png')
```



### circle(radius)

- `radius` \<number\> 从图片取出的圆形区域的半径，半径不能超过原图的最小边的一半。如果超过，则圆的大小仍然是原圆的最大内切圆。

图片内切圆。如果图片的最终格式是 png、webp、 bmp 等支持透明通道的图片，那么图片非圆形区域的地方将会以透明填充。如果图片的最终格式是 jpg，那么非圆形区域是以白色进行填充。推荐保存成 png 格式。如果指定半径大于原图最大内切圆的半径，则圆的大小仍然是图片的最大内切圆。

```javascript
// 将图片裁剪成圆形
img('/path/to/img.png').circle(120).write('/path/to/save.png')
```



### crop(x, y, width, height[, origin])

- `x` \<number\> 指定裁剪起点横坐标（默认左上角为原点）
- `y` \<number\> 指定裁剪起点纵坐标（默认左上角为原点）
- `width` \<number\> 指定裁剪宽度
- `height` \<number\> 指定裁剪高度
- `origin` \<string\> 设置裁剪的原点位置，由九宫格的格式，一共有九个地方可以设置，每个位置位于每个九宫格的左上角

裁剪图片,指定裁剪的起始点以及裁剪的宽高来决定裁剪的区域。如果指定的起始横纵坐标大于原图，将会返回错误：BadRequest, 错误内容是：Advance cut’s position is out of image. 如果从起点开始指定的宽度和高度超过了原图，将会直接裁剪到原图结尾。

裁剪原点位置参数示意图：

|  nw  | north  |  ne  |
| :--: | :----: | :--: |
| west | center | east |
|  sw  | south  |  se  |

```javascript
// 裁剪图片的中心区域 200x200 
img('/path/to/img.png').crop(0, 0, 200, 200, 'center').write('/path/to/save.png')
```



### indexCrop(opt)

- `opt` \<Object\>
  - `x` \<number\> 进行水平切割，每块图片的宽度。
  - `y` \<number\> 进行垂直切割，每块图片的高度。
  - `i` \<number\> 选择切割后第几个块。（0表示第一块）如果超出最大块数，返回原图。

索引切割（横向或纵向）。将图片分成 x 轴和 y 轴，按指定长度 (length) 切割，指定索引 (index)，取出指定的区域。

```javascript
// 裁剪图片
img('/path/to/img.png').indexCrop({x: 100, i: 1}).write('/path/to/save.png')
```



### roundedCorners(radius)

- `radius` \<number\> 圆角的半径。半径最大不能超过原图的最小边的一半。取值范围 [1, 4096]

圆角矩形裁剪。如果图片的最终格式是 png、webp、bmp 等支持透明通道的图片，那么图片非圆形区域的地方将会以透明填充。如果图片的最终格式是 jpg， 那么非圆形区域是以白色进行填充 。推荐保存成 png 格式。如果指定半径大于原图最大内切圆的半径，则圆角的大小仍然是图片的最大内切圆。

```javascript
// 裁剪半径20px的圆角矩形
img('/path/to/img.png').roundedCorners(20).write('/path/to/save.png')
```



### autoOrient(value)

- `value` \<number\> 0：表示按原图默认方向，不进行自动旋转。1：先进行图片进行旋转，然后再进行缩略

自适应方向。某些手机拍摄出来的照片可能带有旋转参数（存放在照片exif信息里面）。可以设置是否对这些图片进行旋转。默认是设置自适应方向。进行自适应方向旋转，要求原图的宽度和高度必须小于 4096。如果原图没有旋转参数，加上auto-orient参数不会对图有影响。

```javascript
// 自适应方向
img('/path/to/img.png').autoOrient(1).write('/path/to/save.png')
```



### rotate(angle)

- `angle` \<number\> 图片旋转的角度。正值为顺时针旋转，负值为逆时针旋转。

图片旋转。旋转图片可能会导致图片的尺寸变大。旋转对图片的尺寸有限制，图片的宽或者高不能超过 4096 px。重复调用，在原值上面叠加效果。

```javascript
// 顺时针旋转90度
img('/path/to/img.png').rotate(90).write('/path/to/save.png')
```



### blur(radius, standard)

- `radius` \<number\> 模糊半径。值越大图片越模糊，取值[1, 50]。超出边界则取边界值
- `standard` \<number\> 正态分布的标准差。值越大图片越模糊。取值[1, 50]。超出边界则取边界值

图片模糊操作。重复调用，在原值上面叠加效果

```javascript
// 对图片进行模糊操作
img('/path/to/img.png').blur(20, 10).write('/path/to/save.png')
```



### bright(brightness)

- `brightness` \<number\> 亮度调整。0 表示原图亮度，小于 0 表示低于原图亮度，大于 0 表示高于原图亮度。取值[-100, 100]，超出边界则取边界值

调节图片亮度。重复调用，在原值上面叠加效果

```javascript
// 提高图片亮度
img('/path/to/img.png').bright(50).write('/path/to/save.png')
```



### contrast(value)

- `value` \<number\> 对比度。0 表示原图对比度，小于 0 表示低于原图对比度，大于 0 表示高于原图对比度。取值[-100, 100]，超出边界则取边界值

调节图片对比度。重复调用，在原值上面叠加效果

```javascript
// 提高图片对比度
img('/path/to/img.png').contrast(50).write('/path/to/save.png')
```



### sharpen(value)

- `value` \<number\> 锐化值。参数越大，越清晰。取值[50, 399]，超出边界则取边界值。为达到较优效果，推荐取值为 100。

图片锐化操作，使图片变得清晰。重复调用，在原值上面叠加效果

```javascript
// 图片锐化操作
img('/path/to/img.png').sharpen(100).write('/path/to/save.png')
```



### format(type)

- `type` \<string\> 输出的图片格式，可选`jpg`,`png`,`bmp`,`webp`,`gif`

将图片转换成对应格式(jpg, png, bmp, webp，gif)。 默认不填格式，是按原图格式返回。**Img** 类的 `TYPE_LIST` 静态属性包含支持的值列表。

```javascript
// png 转换成 jpg 格式
img('/path/to/img.png').format('jpg').write('/path/to/save.jpg')
```



### interlace(type)

- `type` \<number\> 0 表示保存成普通的 jpg 格式，1 表示保存成渐进显示的 jpg 格式

调节 jpg 格式图片的呈现方式

图片格式为 jpg 时有两种呈现方式：
- 自上而下的扫描式
- 先模糊后逐渐清晰（在网络环境比较差时明显）

默认保存为第一种，如果要指定先模糊后清晰的呈现方式，请使用渐进显示参数。注意：此参数只有当效果图是 jpg 格式时才有意义 。

```javascript
// 将图片转换成渐进式图片
img('/path/to/img.jpg').interlace(1).write('/path/to/save.jpg')
```



### quality(value)

- `value` \<number\> 百分比，决定图片的相对质量，对原图按照 value% 进行质量压缩。如果原图质量是 100%，使用 90 会得到质量为 90％ 的图片；如果原图质量是 80%，使用 90 会得到质量72%的图片。只能在原图是 jpg 格式的图片上使用，才有相对压缩的概念。如果原图为 webp，那么相对质量就相当于绝对质量。传入值超过边界值时，取边界值

如果图片保存成 jpg 或 webp, 可以支持质量变换。重复调用，在原值上面叠加效果

```javascript
// 调节图片质量
img('/path/to/img.jpg').quality(50).write('/path/to/save.jpg')
```



### absQual(value)

- `value` \<number\> 百分比，决定图片的绝对质量，把原图质量压到 **value%**，如果原图质量小于指定数字，则不压缩。如果原图质量是100%，使用”90”会得到质量90％的图片；如果原图质量是95%，使用“90”还会得到质量90%的图片；如果原图质量是80%，使用“90”不会压缩，返回质量80%的原图。只能在保存格式为jpg/webp效果上使用，其他格式无效果。 如果同时指定了相对和绝对，按绝对值来处理。传入值超过边界值时，取边界值

如果图片保存成 jpg 或 webp, 可以支持质量变换。

```javascript
// 调节图片质量
img('/path/to/img.jpg').absQual(80).write('/path/to/save.jpg')
```



### watermark(content[, opt])

- `content` \<string | Img\> 水印内容，字符串或 Img 实例
- `opt` \<Object\> 选项
  - `x` \<number\> 水平边距，就是距离图片边缘的水平距离， 这个参数只有当水印位置是左上，左中，左下， 右上，右中，右下才有意义。默认值：10 。取值范围：[0 – 4096] 。超过边界，则取边界值。单位：像素（px）
  - `y` \<number\> 垂直边距, 就是距离图片边缘的垂直距离， 这个参数只有当水印位置是左上，中上， 右上，左下，中下，右下才有意义。默认值：10 。取值范围：[0 – 4096] 。超过边界，则取边界值。单位：像素(px)
  - `position` \<string\> 位置，水印打在图的位置，详情参考下方区域数值对应图。取值范围：[nw,north,ne,west,center,east,ne,south]。**Img** 类的 `ORIGIN_LIST` 静态属性包含全部可选项
  - `transparency` \<number\> 透明度。默认值：100， 表示 100%（不透明） 取值范围: [0-100]，超过边界，则取边界值
  - `voffset` \<number\> 中线垂直偏移，当水印位置在左中，中部，右中时，可以指定水印位置根据中线往上或者往下偏移。默认值：0 。取值范围：[-1000, 1000] 。超过边界，则取边界值。单位：像素(px)
  - `fill` \<number\> 进行水印铺满的效果；取值范围：[0,1]，1表示铺满，0表示效果无效

图片水印。水印操作可以在图片上设置另外一张图片或一段文字做为水印。

**区域数值以及每个区域对应的基准点如下图**

|  nw  | north  |  ne  |
| :--: | :----: | :--: |
| west | center | east |
|  sw  | south  |  se  |

```javascript
// 文本水印
img('/path/to/img.png').watermark('Hello World').write('/path/to/save.png')

// 图片水印
img('/path/to/background.png').watermark(img('/path/to/headimg.jpg')).write('/path/to/save.png')
```



### fill(color)

- `color` \<string\> 文字水印的颜色。6位16进制数 如：000000表示黑色。FFFFFF表示的是白色。默认值：黑色

设置文字填充颜色

```javascript
// 设置文字为红色
img('/path/to/img.png').fill('FF0000')
```



### font(name)

- `name` \<string\> 文字水印的字体类型。默认值：文泉驿正黑。可输入参数对应的中文

设置文字字体。**Img** 类的静态属性 `FONTS_LIST` 和 `FONTS_LIST_CN` 包含支持的值列表

**文字类型编码对应表**

| 参数值               | 中文意思              |
| ----------------- | ----------------- |
| wqy-zenhei        | 文泉驿正黑             |
| wqy-microhei      | 文泉微米黑             |
| fangzhengshusong  | 方正书宋              |
| fangzhengkaiti    | 方正楷体              |
| fangzhengheiti    | 方正黑体              |
| fangzhengfangsong | 方正仿宋              |
| droidsansfallback | DroidSansFallback |

```javascript
// 设置文字字体
img('/path/to/img.png').font('方正楷体')
```



### fontSize(size)

- `size` \<number\> 文字水印大小(px)。取值范围：(0，1000]，传入值超过边界值时，取边界值。默认值：40

设置文字大小

```javascript
// 设置文字大小
img('/path/to/img.png').fontSize(200)
```



### textShadow(transparency)

- `transparency` \<number\> 文字阴影的透明度。取值范围：(0, 100]，传入值超过边界值时，取边界值

设置文字水印的阴影透明度

```javascript
// 设置文字阴影透明度
img('/path/to/img.png').textShadow(80)
```



### textRotate(angle)

- `angle` \<number\> 文字的旋转角度。正值为顺时针旋转，负值为逆时针旋转。

设置文字的旋转角度

```javascript
// 设置文字的旋转90度
img('/path/to/img.png').textRotate(90)
```



### save(path)

- `path` \<string\> 保存至OSS的路径

将处理后的图片保存阿里云OSS，获取保存后的图片URL

```javascript
// http://[bucket].[region].aliyuncs.com/cloud.jpg
let url = await img('/path/to/resource.jpg').save('cloud.jpg')
```



### stream()

获取处理后图片的数据流

```javascript
img('/path/to/save.png').stream()
```



### toBuffer()

获取处理后图片的二进制数据

```javascript
let buffer = await img('/path/to/img.png').toBuffer()
```



### write(fullpath)

- `fullpath` \<string\> 本地文件路径

将处理后的图片写入本地文件

```javascript
img('/path/to/img.png').write('/path/to/compress.jpg')
```