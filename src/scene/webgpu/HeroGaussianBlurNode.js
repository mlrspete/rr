import { PostProcessingUtils, RenderTarget, Vector2 } from "three/webgpu";
import {
  Fn,
  If,
  NodeMaterial,
  NodeUpdateType,
  QuadMesh,
  TempNode,
  convertToTexture,
  float,
  mul,
  nodeObject,
  passTexture,
  uniform,
  uv,
  vec2,
  vec4,
} from "three/tsl";

const horizontalQuad = new QuadMesh();
const verticalQuad = new QuadMesh();

let rendererState;

const premult = Fn(([color]) => {
  return vec4(color.rgb.mul(color.a), color.a);
}).setLayout({
  name: "premult",
  type: "vec4",
  inputs: [{ name: "color", type: "vec4" }],
});

const unpremult = Fn(([color]) => {
  If(color.a.equal(0.0), () => vec4(0.0));
  return vec4(color.rgb.div(color.a), color.a);
}).setLayout({
  name: "unpremult",
  type: "vec4",
  inputs: [{ name: "color", type: "vec4" }],
});

class HeroGaussianBlurNode extends TempNode {
  constructor(textureNode, directionNode = null, sigma = 2) {
    super("vec4");

    this.textureNode = textureNode;
    this.directionNode = directionNode;
    this.sigma = sigma;

    this.resolution = new Vector2(1, 1);
    this.premultipliedAlpha = false;
    this.updateBeforeType = NodeUpdateType.FRAME;

    this.invSize = uniform(new Vector2());
    this.passDirection = uniform(new Vector2());

    this.horizontalTarget = new RenderTarget(1, 1, { depthBuffer: false });
    this.horizontalTarget.texture.name = "HeroGaussianBlur.horizontal";
    this.verticalTarget = new RenderTarget(1, 1, { depthBuffer: false });
    this.verticalTarget.texture.name = "HeroGaussianBlur.vertical";

    this.textureOutputNode = passTexture(this, this.verticalTarget.texture);
    this.textureOutputNode.uvNode = textureNode.uvNode;
  }

  setSize(width, height) {
    width = Math.max(Math.round(width * this.resolution.x), 1);
    height = Math.max(Math.round(height * this.resolution.y), 1);

    this.invSize.value.set(1 / width, 1 / height);
    this.horizontalTarget.setSize(width, height);
    this.verticalTarget.setSize(width, height);
  }

  updateBefore(frame) {
    const { renderer } = frame;
    const textureNode = this.textureNode;
    const sourceTexture = textureNode.value;

    rendererState = PostProcessingUtils.resetRendererState(renderer, rendererState);

    horizontalQuad.material = this.material;
    verticalQuad.material = this.material;
    this.setSize(sourceTexture.image.width, sourceTexture.image.height);

    this.horizontalTarget.texture.type = sourceTexture.type;
    this.verticalTarget.texture.type = sourceTexture.type;

    renderer.setRenderTarget(this.horizontalTarget);
    this.passDirection.value.set(1, 0);
    horizontalQuad.render(renderer);

    textureNode.value = this.horizontalTarget.texture;
    renderer.setRenderTarget(this.verticalTarget);
    this.passDirection.value.set(0, 1);
    verticalQuad.render(renderer);

    textureNode.value = sourceTexture;
    PostProcessingUtils.restoreRendererState(renderer, rendererState);
  }

  dispose() {
    this.horizontalTarget.dispose();
    this.verticalTarget.dispose();
  }

  setup(builder) {
    const textureNode = this.textureNode;
    const uvNode = textureNode.uvNode || uv();
    const directionNode = vec2(this.directionNode || 1);

    let sampleTexture;
    let output;

    if (this.premultipliedAlpha) {
      sampleTexture = (nextUv) => premult(textureNode.uv(nextUv));
      output = (color) => unpremult(color);
    } else {
      sampleTexture = (nextUv) => textureNode.uv(nextUv);
      output = (color) => color;
    }

    const blur = Fn(() => {
      const kernelSize = 3 + 2 * this.sigma;
      const gaussianCoefficients = getGaussianCoefficients(kernelSize);
      const direction = directionNode.mul(this.passDirection);
      const weightSum = float(gaussianCoefficients[0]).toVar();
      const diffuseSum = vec4(sampleTexture(uvNode).mul(weightSum)).toVar();

      for (let index = 1; index < kernelSize; index += 1) {
        const x = float(index);
        const weight = float(gaussianCoefficients[index]);
        const uvOffset = vec2(direction.mul(this.invSize.mul(x))).toVar();
        const sampleA = sampleTexture(uvNode.add(uvOffset));
        const sampleB = sampleTexture(uvNode.sub(uvOffset));

        diffuseSum.addAssign(sampleA.add(sampleB).mul(weight));
        weightSum.addAssign(mul(2.0, weight));
      }

      return output(diffuseSum.div(weightSum));
    });

    const material = this.material || (this.material = new NodeMaterial());
    material.name = "HeroGaussianBlur";
    material.fragmentNode = blur().context(builder.getSharedContext());
    material.needsUpdate = true;

    const properties = builder.getNodeProperties(this);
    properties.textureNode = textureNode;

    return this.textureOutputNode;
  }
}

function getGaussianCoefficients(kernelRadius) {
  const coefficients = [];

  for (let index = 0; index < kernelRadius; index += 1) {
    coefficients.push(
      (0.39894 * Math.exp((-0.5 * index * index) / (kernelRadius * kernelRadius))) /
        kernelRadius,
    );
  }

  return coefficients;
}

export function heroGaussianBlur(node, directionNode, sigma) {
  return nodeObject(new HeroGaussianBlurNode(convertToTexture(node), directionNode, sigma));
}
