import{S as ee,B as te,M as H,a as se,P as ie,b,c as Z,O as re,d as O,F as y,e as A,U as V,V as T,W as B,H as D,N as ae,C as oe,R as ne,f as le,g as he,L as ue,h as ce,i as fe,A as de,j as pe,k as me,l as F,m as _,n as ge,o as ve,p as be,q as xe,G as Me,r as N,s as k,t as U,u as Ce,v as W,w as z}from"./three-core-CasMHhxN.js";class De extends ee{constructor(){super();const e=new te;e.deleteAttribute("uv");const t=new H({side:se}),r=new H,i=new ie(16777215,900,28,2);i.position.set(.418,16.199,.3),this.add(i);const s=new b(e,t);s.position.set(-.757,13.219,.717),s.scale.set(31.713,28.305,28.591),this.add(s);const a=new b(e,r);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);const n=new b(e,r);n.position.set(-5.607,-.754,-.758),n.rotation.set(0,.994,0),n.scale.set(1.97,1.534,3.955),this.add(n);const l=new b(e,r);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);const h=new b(e,r);h.position.set(-2.017,.018,6.124),h.rotation.set(0,.333,0),h.scale.set(2.002,4.566,2.064),this.add(h);const c=new b(e,r);c.position.set(2.291,-.756,-2.621),c.rotation.set(0,-.286,0),c.scale.set(1.546,1.552,1.496),this.add(c);const o=new b(e,r);o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),this.add(o);const u=new b(e,P(50));u.position.set(-16.116,14.37,8.208),u.scale.set(.1,2.428,2.739),this.add(u);const f=new b(e,P(50));f.position.set(-16.109,18.021,-8.207),f.scale.set(.1,2.425,2.751),this.add(f);const p=new b(e,P(17));p.position.set(14.904,12.198,-1.832),p.scale.set(.15,4.265,6.331),this.add(p);const d=new b(e,P(43));d.position.set(-.462,8.89,14.52),d.scale.set(4.38,5.441,.088),this.add(d);const m=new b(e,P(20));m.position.set(3.235,11.486,-12.541),m.scale.set(2.5,2,.1),this.add(m);const v=new b(e,P(100));v.position.set(0,20,0),v.scale.set(1,.1,1),this.add(v)}dispose(){const e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(const t of e)t.dispose()}}function P(x){const e=new Z;return e.color.setScalar(x),e}const $={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class R{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Te=new re(-1,1,1,-1,0,1);class _e extends O{constructor(){super(),this.setAttribute("position",new y([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new y([0,2,0,0,2,0],2))}}const we=new _e;class G{constructor(e){this._mesh=new b(we,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Te)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Se extends R{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof A?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=V.clone(e.uniforms),this.material=new A({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new G(this.material)}render(e,t,r){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=r.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class K extends R{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,r){const i=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,n;this.inverse?(a=0,n=1):(a=1,n=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),s.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),s.buffers.stencil.setClear(n),s.buffers.stencil.setLocked(!0),e.setRenderTarget(r),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(i.EQUAL,1,4294967295),s.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),s.buffers.stencil.setLocked(!0)}}class ye extends R{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class Ve{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const r=e.getSize(new T);this._width=r.width,this._height=r.height,t=new B(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:D}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Se($),this.copyPass.material.blending=ae,this.clock=new oe}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let r=!1;for(let i=0,s=this.passes.length;i<s;i++){const a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,r),a.needsSwap){if(r){const n=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(n.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(n.EQUAL,1,4294967295)}this.swapBuffers()}K!==void 0&&(a instanceof K?r=!0:a instanceof ye&&(r=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new T);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const r=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(r,i),this.renderTarget2.setSize(r,i);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(r,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}const Pe={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class je extends R{constructor(){super();const e=Pe;this.uniforms=V.clone(e.uniforms),this.material=new ne({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new G(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,r){this.uniforms.tDiffuse.value=r.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},le.getTransfer(this._outputColorSpace)===he&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===ue?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ce?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===fe?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===de?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===pe?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===me&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class Ne extends R{constructor(e,t,r=null,i=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=r,this.clearColor=i,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new F}render(e,t,r){const i=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:r),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=i}}const Ae={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new F(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class E extends R{constructor(e,t,r,i){super(),this.strength=t!==void 0?t:1,this.radius=r,this.threshold=i,this.resolution=e!==void 0?new T(e.x,e.y):new T(256,256),this.clearColor=new F(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new B(s,a,{type:D}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let o=0;o<this.nMips;o++){const u=new B(s,a,{type:D});u.texture.name="UnrealBloomPass.h"+o,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);const f=new B(s,a,{type:D});f.texture.name="UnrealBloomPass.v"+o,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),s=Math.round(s/2),a=Math.round(a/2)}const n=Ae;this.highPassUniforms=V.clone(n.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new A({uniforms:this.highPassUniforms,vertexShader:n.vertexShader,fragmentShader:n.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let o=0;o<this.nMips;o++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[o])),this.separableBlurMaterials[o].uniforms.invSize.value=new T(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const h=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=h,this.bloomTintColors=[new _(1,1,1),new _(1,1,1),new _(1,1,1),new _(1,1,1),new _(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const c=$;this.copyUniforms=V.clone(c.uniforms),this.blendMaterial=new A({uniforms:this.copyUniforms,vertexShader:c.vertexShader,fragmentShader:c.fragmentShader,blending:ge,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new F,this.oldClearAlpha=1,this.basic=new Z,this.fsQuad=new G(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let r=Math.round(e/2),i=Math.round(t/2);this.renderTargetBright.setSize(r,i);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(r,i),this.renderTargetsVertical[s].setSize(r,i),this.separableBlurMaterials[s].uniforms.invSize.value=new T(1/r,1/i),r=Math.round(r/2),i=Math.round(i/2)}render(e,t,r,i,s){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=r.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let n=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=n.texture,this.separableBlurMaterials[l].uniforms.direction.value=E.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=E.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),n=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(r),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=a}getSeperableBlurMaterial(e){const t=[];for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(e*e))/e);return new A({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new T(.5,.5)},direction:{value:new T(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new A({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}E.BlurDirectionX=new T(1,0);E.BlurDirectionY=new T(0,1);const Re=/^[og]\s*(.+)?/,Fe=/^mtllib /,Ee=/^usemtl /,Ue=/^usemap /,X=/\s+/,q=new _,I=new _,J=new _,Y=new _,C=new _,L=new F;function Le(){const x={objects:[],object:{},vertices:[],normals:[],colors:[],uvs:[],materials:{},materialLibraries:[],startObject:function(e,t){if(this.object&&this.object.fromDeclaration===!1){this.object.name=e,this.object.fromDeclaration=t!==!1;return}const r=this.object&&typeof this.object.currentMaterial=="function"?this.object.currentMaterial():void 0;if(this.object&&typeof this.object._finalize=="function"&&this.object._finalize(!0),this.object={name:e||"",fromDeclaration:t!==!1,geometry:{vertices:[],normals:[],colors:[],uvs:[],hasUVIndices:!1},materials:[],smooth:!0,startMaterial:function(i,s){const a=this._finalize(!1);a&&(a.inherited||a.groupCount<=0)&&this.materials.splice(a.index,1);const n={index:this.materials.length,name:i||"",mtllib:Array.isArray(s)&&s.length>0?s[s.length-1]:"",smooth:a!==void 0?a.smooth:this.smooth,groupStart:a!==void 0?a.groupEnd:0,groupEnd:-1,groupCount:-1,inherited:!1,clone:function(l){const h={index:typeof l=="number"?l:this.index,name:this.name,mtllib:this.mtllib,smooth:this.smooth,groupStart:0,groupEnd:-1,groupCount:-1,inherited:!1};return h.clone=this.clone.bind(h),h}};return this.materials.push(n),n},currentMaterial:function(){if(this.materials.length>0)return this.materials[this.materials.length-1]},_finalize:function(i){const s=this.currentMaterial();if(s&&s.groupEnd===-1&&(s.groupEnd=this.geometry.vertices.length/3,s.groupCount=s.groupEnd-s.groupStart,s.inherited=!1),i&&this.materials.length>1)for(let a=this.materials.length-1;a>=0;a--)this.materials[a].groupCount<=0&&this.materials.splice(a,1);return i&&this.materials.length===0&&this.materials.push({name:"",smooth:this.smooth}),s}},r&&r.name&&typeof r.clone=="function"){const i=r.clone(0);i.inherited=!0,this.object.materials.push(i)}this.objects.push(this.object)},finalize:function(){this.object&&typeof this.object._finalize=="function"&&this.object._finalize(!0)},parseVertexIndex:function(e,t){const r=parseInt(e,10);return(r>=0?r-1:r+t/3)*3},parseNormalIndex:function(e,t){const r=parseInt(e,10);return(r>=0?r-1:r+t/3)*3},parseUVIndex:function(e,t){const r=parseInt(e,10);return(r>=0?r-1:r+t/2)*2},addVertex:function(e,t,r){const i=this.vertices,s=this.object.geometry.vertices;s.push(i[e+0],i[e+1],i[e+2]),s.push(i[t+0],i[t+1],i[t+2]),s.push(i[r+0],i[r+1],i[r+2])},addVertexPoint:function(e){const t=this.vertices;this.object.geometry.vertices.push(t[e+0],t[e+1],t[e+2])},addVertexLine:function(e){const t=this.vertices;this.object.geometry.vertices.push(t[e+0],t[e+1],t[e+2])},addNormal:function(e,t,r){const i=this.normals,s=this.object.geometry.normals;s.push(i[e+0],i[e+1],i[e+2]),s.push(i[t+0],i[t+1],i[t+2]),s.push(i[r+0],i[r+1],i[r+2])},addFaceNormal:function(e,t,r){const i=this.vertices,s=this.object.geometry.normals;q.fromArray(i,e),I.fromArray(i,t),J.fromArray(i,r),C.subVectors(J,I),Y.subVectors(q,I),C.cross(Y),C.normalize(),s.push(C.x,C.y,C.z),s.push(C.x,C.y,C.z),s.push(C.x,C.y,C.z)},addColor:function(e,t,r){const i=this.colors,s=this.object.geometry.colors;i[e]!==void 0&&s.push(i[e+0],i[e+1],i[e+2]),i[t]!==void 0&&s.push(i[t+0],i[t+1],i[t+2]),i[r]!==void 0&&s.push(i[r+0],i[r+1],i[r+2])},addUV:function(e,t,r){const i=this.uvs,s=this.object.geometry.uvs;s.push(i[e+0],i[e+1]),s.push(i[t+0],i[t+1]),s.push(i[r+0],i[r+1])},addDefaultUV:function(){const e=this.object.geometry.uvs;e.push(0,0),e.push(0,0),e.push(0,0)},addUVLine:function(e){const t=this.uvs;this.object.geometry.uvs.push(t[e+0],t[e+1])},addFace:function(e,t,r,i,s,a,n,l,h){const c=this.vertices.length;let o=this.parseVertexIndex(e,c),u=this.parseVertexIndex(t,c),f=this.parseVertexIndex(r,c);if(this.addVertex(o,u,f),this.addColor(o,u,f),n!==void 0&&n!==""){const p=this.normals.length;o=this.parseNormalIndex(n,p),u=this.parseNormalIndex(l,p),f=this.parseNormalIndex(h,p),this.addNormal(o,u,f)}else this.addFaceNormal(o,u,f);if(i!==void 0&&i!==""){const p=this.uvs.length;o=this.parseUVIndex(i,p),u=this.parseUVIndex(s,p),f=this.parseUVIndex(a,p),this.addUV(o,u,f),this.object.geometry.hasUVIndices=!0}else this.addDefaultUV()},addPointGeometry:function(e){this.object.geometry.type="Points";const t=this.vertices.length;for(let r=0,i=e.length;r<i;r++){const s=this.parseVertexIndex(e[r],t);this.addVertexPoint(s),this.addColor(s)}},addLineGeometry:function(e,t){this.object.geometry.type="Line";const r=this.vertices.length,i=this.uvs.length;for(let s=0,a=e.length;s<a;s++)this.addVertexLine(this.parseVertexIndex(e[s],r));for(let s=0,a=t.length;s<a;s++)this.addUVLine(this.parseUVIndex(t[s],i))}};return x.startObject("",!1),x}class ze extends ve{constructor(e){super(e),this.materials=null}load(e,t,r,i){const s=this,a=new be(this.manager);a.setPath(this.path),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(n){try{t(s.parse(n))}catch(l){i?i(l):console.error(l),s.manager.itemError(e)}},r,i)}setMaterials(e){return this.materials=e,this}parse(e){const t=new Le;e.indexOf(`\r
`)!==-1&&(e=e.replace(/\r\n/g,`
`)),e.indexOf(`\\
`)!==-1&&(e=e.replace(/\\\n/g,""));const r=e.split(`
`);let i=[];for(let n=0,l=r.length;n<l;n++){const h=r[n].trimStart();if(h.length===0)continue;const c=h.charAt(0);if(c!=="#")if(c==="v"){const o=h.split(X);switch(o[0]){case"v":t.vertices.push(parseFloat(o[1]),parseFloat(o[2]),parseFloat(o[3])),o.length>=7?(L.setRGB(parseFloat(o[4]),parseFloat(o[5]),parseFloat(o[6]),xe),t.colors.push(L.r,L.g,L.b)):t.colors.push(void 0,void 0,void 0);break;case"vn":t.normals.push(parseFloat(o[1]),parseFloat(o[2]),parseFloat(o[3]));break;case"vt":t.uvs.push(parseFloat(o[1]),parseFloat(o[2]));break}}else if(c==="f"){const u=h.slice(1).trim().split(X),f=[];for(let d=0,m=u.length;d<m;d++){const v=u[d];if(v.length>0){const M=v.split("/");f.push(M)}}const p=f[0];for(let d=1,m=f.length-1;d<m;d++){const v=f[d],M=f[d+1];t.addFace(p[0],v[0],M[0],p[1],v[1],M[1],p[2],v[2],M[2])}}else if(c==="l"){const o=h.substring(1).trim().split(" ");let u=[];const f=[];if(h.indexOf("/")===-1)u=o;else for(let p=0,d=o.length;p<d;p++){const m=o[p].split("/");m[0]!==""&&u.push(m[0]),m[1]!==""&&f.push(m[1])}t.addLineGeometry(u,f)}else if(c==="p"){const u=h.slice(1).trim().split(" ");t.addPointGeometry(u)}else if((i=Re.exec(h))!==null){const o=(" "+i[0].slice(1).trim()).slice(1);t.startObject(o)}else if(Ee.test(h))t.object.startMaterial(h.substring(7).trim(),t.materialLibraries);else if(Fe.test(h))t.materialLibraries.push(h.substring(7).trim());else if(Ue.test(h))console.warn('THREE.OBJLoader: Rendering identifier "usemap" not supported. Textures must be defined in MTL files.');else if(c==="s"){if(i=h.split(" "),i.length>1){const u=i[1].trim().toLowerCase();t.object.smooth=u!=="0"&&u!=="off"}else t.object.smooth=!0;const o=t.object.currentMaterial();o&&(o.smooth=t.object.smooth)}else{if(h==="\0")continue;console.warn('THREE.OBJLoader: Unexpected line: "'+h+'"')}}t.finalize();const s=new Me;if(s.materialLibraries=[].concat(t.materialLibraries),!(t.objects.length===1&&t.objects[0].geometry.vertices.length===0)===!0)for(let n=0,l=t.objects.length;n<l;n++){const h=t.objects[n],c=h.geometry,o=h.materials,u=c.type==="Line",f=c.type==="Points";let p=!1;if(c.vertices.length===0)continue;const d=new O;d.setAttribute("position",new y(c.vertices,3)),c.normals.length>0&&d.setAttribute("normal",new y(c.normals,3)),c.colors.length>0&&(p=!0,d.setAttribute("color",new y(c.colors,3))),c.hasUVIndices===!0&&d.setAttribute("uv",new y(c.uvs,2));const m=[];for(let M=0,j=o.length;M<j;M++){const w=o[M],Q=w.name+"_"+w.smooth+"_"+p;let g=t.materials[Q];if(this.materials!==null){if(g=this.materials.create(w.name),u&&g&&!(g instanceof N)){const S=new N;k.prototype.copy.call(S,g),S.color.copy(g.color),g=S}else if(f&&g&&!(g instanceof U)){const S=new U({size:10,sizeAttenuation:!1});k.prototype.copy.call(S,g),S.color.copy(g.color),S.map=g.map,g=S}}g===void 0&&(u?g=new N:f?g=new U({size:1,sizeAttenuation:!1}):g=new Ce,g.name=w.name,g.flatShading=!w.smooth,g.vertexColors=p,t.materials[Q]=g),m.push(g)}let v;if(m.length>1){for(let M=0,j=o.length;M<j;M++){const w=o[M];d.addGroup(w.groupStart,w.groupCount,M)}u?v=new W(d,m):f?v=new z(d,m):v=new b(d,m)}else u?v=new W(d,m[0]):f?v=new z(d,m[0]):v=new b(d,m[0]);v.name=h.name,s.add(v)}else if(t.vertices.length>0){const n=new U({size:1,sizeAttenuation:!1}),l=new O;l.setAttribute("position",new y(t.vertices,3)),t.colors.length>0&&t.colors[0]!==void 0&&(l.setAttribute("color",new y(t.colors,3)),n.vertexColors=!0);const h=new z(l,n);s.add(h)}return s}}export{Ve as E,ze as O,De as R,Se as S,E as U,Ne as a,je as b};
