import { Global, Module } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { AXIOS_INSTANCE } from './http.constants';

@Global()
@Module({
  providers: [
    {
      provide: AXIOS_INSTANCE,
      useFactory: (): AxiosInstance =>
        axios.create({
          timeout: Number(process.env.HTTP_TIMEOUT_MS ?? 10_000),
          headers: {
            Accept: 'application/json',
          },
        }),
    },
  ],
  exports: [AXIOS_INSTANCE],
})
export class HttpModule {}
