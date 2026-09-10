import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrintOrder, PrintOrderSchema } from './schemas/print-order.schema';
import { PrintingService } from './printing.service';
import { PrintingController } from './printing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrintOrder.name, schema: PrintOrderSchema },
    ]),
  ],
  controllers: [PrintingController],
  providers: [PrintingService],
  exports: [PrintingService],
})
export class PrintingModule {}
