import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MediaAssetSchema {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ default: 'image', enum: ['image', 'video', 'raw'] })
  resourceType: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  format?: string;

  @Prop()
  bytes?: number;

  @Prop()
  alt?: string;
}

export const MediaAssetMongooseSchema = SchemaFactory.createForClass(MediaAssetSchema);
