import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateRazorpayOrderDto, VerifyRazorpayPaymentDto } from './dto/razorpay.dto';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  async createOrder(@Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto);
  }

  @Post('verify')
  async verifyPayment(@Body() dto: VerifyRazorpayPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Get('status/:razorpayOrderId')
  async getStatus(@Param('razorpayOrderId') razorpayOrderId: string) {
    return this.paymentsService.getPaymentStatus(razorpayOrderId);
  }

  @Post('razorpay/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(body);
    return this.paymentsService.handleWebhook(signature, rawBody, body);
  }
}
