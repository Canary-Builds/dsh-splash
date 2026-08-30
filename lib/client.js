// Client half of dsh-plugin-splash: ChatGPT-style collapsed sidebar.
// Graduated from dynamic plugin whale-1/pkg-1. Hand-written static client
// module in the served ModuleLoader format (identical to the shipped
// bundles): window.__ModuleLoader__.load({ id, factory }) with require
// limited to the seeded externals (react, ...).
//
// Effects, all owned by this plugin's fiber:
//   - one <style> tag (data-plugin-css) with the redesign rules;
//   - one shell.overlay list entry ("whale-fab"): a floating whale button,
//     top-left, visible only while the sidebar is collapsed; clicking it
//     calls ctx.layout.toggleSidebar().
//
// The collapse redesign is pure CSS keyed off the frame's public
// data-sidebar-collapsed attribute (set by ui-layout's AppFrame):
//   - [data-sidebar-collapsed]>.pI_x6G_sidebarCol  -> visibility:hidden
//     (the 56px icon rail disappears entirely);
//   - [data-sidebar-collapsed]>.pI_x6G_centerCol   -> margin-left:-56px
//     (the chat area reclaims the full rail width);
//   - [data-sidebar-collapsed] .wSkVaW_header      -> padding-left:60px
//     (the session title clears the floating whale);
//   - .nL4_yW_sessionLogButton                     -> icon-only 32x32 pill,
//     absolutely positioned into the header's tab row, right-aligned
//     (the "Session log" text stays in the a11y tree, visually hidden);
//   - .SVAs4q_label (the agent-preset mode chip)   -> relocated into the
//     same tab row, left of the download button; preset name abbreviated
//     to three letters (STD/PTC/MIN/CTR via the label's title prefix).

window.__ModuleLoader__.load({
	id: "dsh-plugin-splash",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		//#region styles (one style tag per document)
		// PWA/mobile-only: rules apply to real app windows (standalone,
		// fullscreen, minimal-ui) AND to touch devices (phones reached via a
		// home-screen shortcut still report display-mode browser); desktop
		// browser tabs (hover + fine pointer + browser mode) stay stock.
		const SCOPE = "(display-mode: standalone),(display-mode: fullscreen),(display-mode: minimal-ui),(hover:none) and (pointer:coarse)";
		const css = "@media " + SCOPE + "{" + [
			".whalefab-button{position:absolute;top:25.5px;left:10px;z-index:30;display:none;align-items:center;justify-content:center;box-sizing:border-box;width:36px;height:36px;padding:0;border:none;border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}",
			".whalefab-button:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".whalefab-button:active{background:var(--dsw-alias-interactive-bg-active)}",
			".whalefab-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}",
			".whalefab-mark{display:block;width:26px;height:26px;background-color:currentColor;-webkit-mask-image:url(/favicon.svg);mask-image:url(/favicon.svg);-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain;transform:translateY(1.7px)}",
			".pI_x6G_centerCol{transition:margin-left var(--ds-transition-duration-slow) var(--ds-ease-in-out)}",
			"[data-sidebar-collapsed] .whalefab-button{display:flex}",
			"[data-sidebar-collapsed]>.pI_x6G_sidebarCol{visibility:hidden;pointer-events:none}",
			"[data-sidebar-collapsed]>.pI_x6G_centerCol{margin-left:-56px}",
			"[data-sidebar-collapsed] .wSkVaW_header{padding-left:50px;padding-right:0}",
			// v3 — fullscreen sidebar: when open (and details closed), the sidebar
			// column overlays the whole frame instead of pushing the chat; the
			// chat keeps full width underneath.
			".pI_x6G_frame:not([data-sidebar-collapsed])[data-details-collapsed]{grid-template-columns:0px minmax(0,1fr) 0px!important}",
			".pI_x6G_frame:not([data-sidebar-collapsed])[data-details-collapsed]>.pI_x6G_sidebarCol{position:absolute;inset:0;z-index:15}",
			".pI_x6G_frame:not([data-sidebar-collapsed])[data-details-collapsed]>.pI_x6G_handle[data-side=sidebar]{display:none}",
			".pI_x6G_frame:not([data-sidebar-collapsed])[data-details-collapsed] .hHd-Xa_root{width:100%!important}",
			".nL4_yW_sessionLogButton{min-width:0;width:32px;height:32px;padding:0;position:absolute;top:40px;right:28px;z-index:2;border:none;border-radius:0;background:transparent}",
			".nL4_yW_sessionLogButton>span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
			// v9 — settings nav as a top tab strip: no side column, content
			// gets the full width; tabs are icon+label, scrollable horizontally.
			".VOzbGW_panel{flex-direction:column}",
			".VOzbGW_nav{width:auto;flex:none;flex-direction:row;align-items:center;gap:8px;padding:10px 16px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}",
			".VOzbGW_navTitle{visibility:visible;padding:0 8px 0 4px}",
			".VOzbGW_navList{flex-direction:row;gap:4px;flex-wrap:nowrap;overflow-x:auto}",
			// v10 — settings tabs: icon-only cells; Close swaps to the left of
			// the settings-document (open conf file) action via header reversal.
			// v12b — tabs stay icon-only; the General page gains a "General"
			// heading (styled like the Models page title) since its section
			// ships without one.
			".VOzbGW_navCell{height:36px;flex:none;flex-direction:row;justify-content:center;gap:0;width:40px;padding:0;border-radius:10px 10px 0 0}",
			".VOzbGW_navLabel{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
			"._WvWnq_section::before{content:\"General\";color:var(--dsw-alias-label-primary);margin:0 0 12px;font-size:20px;font-weight:500;line-height:28px;display:block}",
			// v11 — header row (open conf, then close at the far right) above
			// the tab strip: content's children become direct panel items via
			// display:contents.
			".VOzbGW_content{display:contents}",
			".VOzbGW_header{order:1}",
			".VOzbGW_nav{order:2}",
			".VOzbGW_options{order:3}",
			// v6 — settings modal fills the entire screen: no margins, no radius.
			".VOzbGW_panel{width:100vw;max-width:100vw;height:100vh;height:100dvh;border-radius:0;box-shadow:none}",
			// v5 — settings preset/permission/enter-behavior rows: the selector
			// moves to the top (full-width), the title + description fill the
			// area below.
			".oY77xG_row,._5QVD0a_row,.T1PP_q_row{flex-direction:column;align-items:stretch;gap:8px}",
			".oY77xG_rowText,._5QVD0a_rowText,.T1PP_q_rowText{order:2;padding-right:0}",
			".oY77xG_selector,._5QVD0a_selector,.T1PP_q_selector{align-self:stretch}",
			// v7 — chat area side padding: 32px/side down to 6px, with the
			// composer clearance variable following so the composer aligns.
			".Md3f7G_scroll{padding-left:12px;padding-right:6px}",
			".wSkVaW_scrollBody{scrollbar-gutter:auto}",
			// v8 — user messages: right-anchored, fit-content size, uncapped so
			// long text extends all the way to the left; square right corners.
			".gdEzaW_userRow{align-items:flex-end}",
			".gdEzaW_userStack{max-width:100%;align-items:flex-end}",
			".gdEzaW_bubble{box-sizing:border-box;overflow-wrap:anywhere;border-radius:22px 22px 0 22px}",
			".FJxK0a_root{padding-left:6px;padding-right:6px}",
			".wSkVaW_root{--dsh-composer-side-clearance:6px}",
			// v2 — agent-preset mode chip (标准模式/创造模式/PTC/极简): relocate
			// into the header tab row, left of the download button, and abbreviate
			// the name to three letters keyed off the label's title (the preset
			// description). The composer write-access control is NOT touched.
			".SVAs4q_label{position:absolute;top:45px;right:70px;z-index:2;font-size:0}",
			".SVAs4q_label::after{font-size:13px;font-weight:500}",
			".SVAs4q_label[title^=\"Full coding agent\"]::after,.SVAs4q_label[title^=\"功能完整\"]::after{content:\"STD\"}",
			".SVAs4q_label[title^=\"All Standard mode\"]::after,.SVAs4q_label[title^=\"具备标准\"]::after{content:\"PTC\"}",
			".SVAs4q_label[title^=\"Two-tool coding agent\"]::after,.SVAs4q_label[title^=\"仅提供持久\"]::after{content:\"MIN\"}",
			".SVAs4q_label[title^=\"Built for creating\"]::after,.SVAs4q_label[title^=\"用于创建\"]::after{content:\"CTR\"}",
		].join("") + "}";
		const tagId = "dsh-plugin-splash/whale.css";
		if (typeof document !== "undefined") {
			// drop a stale tag from the pre-rename name if this page still carries one
			document.querySelectorAll("style[data-plugin=\"dsh-plugin-whale\"]").forEach((t) => t.remove());
			const existing = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]");
			if (existing !== null) existing.textContent = css;
			else {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-plugin-splash";
				tag.dataset.pluginCss = tagId;
				tag.textContent = css;
				document.head.appendChild(tag);
			}
		}
		//#endregion

		function apply(ctx) {
			const FloatingWhale = function () {
				return React.createElement("button", {
					type: "button",
					className: "whalefab-button",
					"aria-label": "Open sidebar",
					title: "Open sidebar",
					onClick: function () { ctx.layout.toggleSidebar(); },
				}, React.createElement("span", { className: "whalefab-mark" }));
			};
			ctx.effect(() => ctx.slots.inject("shell.overlay", () =>
				ctx.slots.register(
					{ name: "shell.overlay", id: "whale-fab", order: 0, label: "Open sidebar" },
					function () { return React.createElement(FloatingWhale); },
				)
			), "splash: overlay entry");
			// v3 — auto-collapse: opening a session from the sidebar list closes
			// the sidebar again (ChatGPT-style). Session rows carry the hashed
			// YDXeBa_sessionRow class; workspace group rows do not. Clicks on
			// inner controls (row menu buttons) are ignored, and the sidebar is
			// only collapsed when it is actually expanded.
			ctx.effect(() => {
				const onClick = (event) => {
					if (window.matchMedia("(display-mode: standalone),(display-mode: fullscreen),(display-mode: minimal-ui),(hover:none) and (pointer:coarse)").matches === false) return;
					const target = event.target;
					if (!(target instanceof Element)) return;
					if (target.closest("button, a, input, [role=menuitem]") !== null) return;
					if (target.closest(".YDXeBa_sessionRow") === null) return;
					if (document.querySelector(".pI_x6G_frame:not([data-sidebar-collapsed])") === null) return;
					ctx.layout.toggleSidebar();
				};
				document.addEventListener("click", onClick, true);
				return () => document.removeEventListener("click", onClick);
			}, "splash: auto-collapse on session open");
		}

		exports.apply = apply;
		exports.inject = ["slots", "layout"];
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
