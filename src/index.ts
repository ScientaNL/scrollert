/// <reference path="../typings/index.d.ts" />
/// <reference path="ScrollertPlugin.ts" />

jQuery.fn[Scrollert.Plugin.NAME] = function(...args) {

    let action:string = typeof args[0] === "string"  ? args[0] : "init",
        options:Scrollert.PluginOptions = (typeof args[1] === "object")
            ? args[1]
            : (typeof args[0] === "object") ? args[0] : {};

    return this.each(function() {

        let elm = jQuery(this),
            key = "plugin-" + Scrollert.Plugin.NAME,
            plugin:Scrollert.Plugin = elm.data(key);

        if(action === "init" && plugin instanceof Scrollert.Plugin === false)
        {
            elm.data(key, plugin = new Scrollert.Plugin(jQuery(this), options));
        }
        else if(plugin instanceof Scrollert.Plugin === false)
        {
            throw new TypeError("The Scrollert plugin is not yet initialized");
        }

        switch(action)
        {
            case "init": //Dolce far niente
                return;
            case "update":
                plugin.update();
                break;
            case "destroy":
                plugin.destroy();
                elm.removeData(key);
                break;
            default:
                throw new TypeError("Invalid Scrollert action " + action);
        }
    });

};