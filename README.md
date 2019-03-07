# Scrollert.js - a cross browser, OSX-like, light weight scrollbar
Scrollert is a jQuery plugin that implements good-looking and uniform scrollbars on all browsers, platforms and devices. It has a small memory and DOM footprint in the browser and is fully customizable through CSS. It creates both horizontal and vertical scrollbars. 

Scrollert.js can be loaded as a [UMD module](https://github.com/umdjs/umd) with your Module loader of choice (SystemJS, RequireJS, Webpack etc) or by loading it globally with a `<script>` tag.

Scrollert.js is written in Typescript and LESS.

Checkout our [website](https://scientanl.github.io/scrollert/) and the [Github repository](https://github.com/scientanl/scrollert)!

# Table of contents
- [Support and compatibility](#support-and-compatibility)
- [Basic usage](#basic-usage)
- [Advanced usage](#advanced-usage)
 - [Default styling](#default-styling)
 - [Custom styling](#custom-styling)
 - [Options](#options)
 - [Methods](#methods)
 - [What if my content or container resizes?](#what-if-my-content-or-container-resizes-)
- [FAQ](#faq)

# Support and compatibility
Scrollert.js is thoroughly field tested and is compatible with:
- *Chrome* (Windows, OSX, Linux)
- *Internet Explorer 9+*
- *Microsoft Edge*
- *Firefox* (Windows, OSX, Linux)
- *Opera* (Windows, OSX, Linx)

# Basic usage
Embed the `scrollert.min.js` and `scrollert.min.css` in your HTML page.
```html
<div class="scrollert">
	<div class="scrollert-content" tabindex="1">
		{your content here}
	</div>
</div>

<!-- Somewhere below in your HTML, before body close -->
<script type="application/javascript">
	$('.scrollert').scrollert();
</script>
```

# Advanced usage
## Default styling
Scrollert.js ships with two scrollbar styles, the default gray style and a white style. Use the white style by adding `scrollert-white` as class to the container element.  
 
```html
<div class="scrollert scrollert-white">
	<div class="scrollert-content" tabindex="1">
		{your content here}
	</div>
</div>
```
## Custom styling
When the default styling does not fit your needs, you can fully customize the scrollbars with CSS.

## Options
It is possible to bootstrap a Scrollert.js instance with the following options:

```javascript
jQuery('.scrollert').scrollert({
	axes: ['y'], 
	'preventOuterScroll': true
});
```
### axes 
Specify to which axis or axes Scrollert.js must listen. Gives horizontal and/or vertical scrollbars.


**Type:** array

**Default:** `['x', 'y']`

### preventOuterScroll (experimental)
Prevents scrolling of parent elements while hovering a scrollert pane.

**Type:** boolean

**Default:** `false`

### cssPrefix
The prefix which is prepended to all css-classes.


**Type:** string

**Default:** `scrollert`

### eventNamespace
The namespace in which all events are added. There is not really a use case to override this, but it is still possible though.

**Type:** string

**Default:** `scrollert`

### contentSelector
Specify a custom content selector. By default the cssPrefix option is used to get the content child out of Scroller's container element. (Default: `.scrollert-content`). If you want to use a custom selector for your content element, you can specify the selector to let Scrollert.js know where to look for the content element. The selector must be a valid `jQuery/sizzle` selector.


**Type:** string

**Default:** `null`

## Methods
The following methods can be called after scrollert is initialized:

### update
To update the scrollbars. This is necessary when the dimensions of the `content element` are changed due to DOM or changes. 
```javascript
jQuery('.scrollert').scrollert('update');
```
### destroy
To destroy a Scrollert.js instance and revert all changes back to how it was before scrollert was initialized.
```javascript
jQuery('.scrollert').scrollert('destroy');
```

## What if my content or container resizes?
It could be the case that your inner content or outer container resizes, due to things such as new content, a toggled view state or a window resize. Both inner and outer events can affect the size of the scrollbar. To detect changes in the content of a Scrollert-pane, you could use libraries such as:
 - https://github.com/sdecima/javascript-detect-element-resize
 - http://marcj.github.io/css-element-queries/

You could fire the update method on Scrollert.js to update the scrollbar according to the changed reality.
```javascript
addResizeListener($('#content-inner'), function() {
    jQuery('.scrollert').scrollert('update');
});
```


# FAQ
<sup>frequently asked and less frequently asked, but still answered:</sup>
## How do I customize Scrollert.js?
You can customize the looks of Scrollert.js by styling it using CSS.

## Why must I specify a tabindex on the content element?
Specifying a tabindex allows the end-user to use it's keyboard arrow keys to navigate while the pane is focussed.

## Why is this plugin created? There are already so many javascript scrollbar plugins
We are Scienta. We want to give our customers the best scrolling experience. The majority of our customers uses Windows. There was only one problem. Although we like windows, we are not quite fond of the default Windows scrollbar, especially not when used in an inline panel. To provide our customers with a beautiful and uniform scrolling experience, we searched for a scrollbar solution. We couldn't find one that suited our needs. So we decided to build one ourselfs.
 
 # Build it yourself
 You don't have to stick to the shipped build. Why not build it yourself? You can run `npm install` and `gulp build` to create a customized build.
