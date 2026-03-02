import React from 'react';
import { BookOpen, HelpCircle, Info, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminDocsPage(): React.ReactNode {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">系统说明</h2>
          <p className="mt-1 text-sm text-slate-500">
            查看 Air Monitor 后台控制台的操作指南与系统规则
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <BookOpen className="size-5" />
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="size-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold">权限与角色说明 (RBAC)</CardTitle>
            </div>
            <CardDescription>系统中的三个基础角色及其对应的操作权限范围。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-2">超级管理员 (Admin)</h4>
                <p>
                  系统的最高权限拥有者。可进行所有数据查看、操作，以及管理其他操作员和普通用户的系统权限，修改所有系统配置。
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-2">操作员 (Operator)</h4>
                <p>
                  负责日常数据和信息管理。可查看各项统计数据、管理普通公告、启用或禁用普通用户账号，但无法修改系统底层配置。
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-2">普通用户 (User/Viewer)</h4>
                <p>
                  基础只读权限。可登录后台查看当前系统运行的非敏感类统计数据、查看历史公告记录，无法进行任何系统层面的修改操作。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Info className="size-5 text-blue-600" />
              <CardTitle className="text-base font-semibold">缓存机制说明</CardTitle>
            </div>
            <CardDescription>针对空气质量与天气第三方接口调用实施的数据缓存策略。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Redis 高效拦截：</strong> 所有外部 API (如
                QWeather 数据) 调用前均经过 Redis
                查询，命中缓存则直接返回结果，显著降低公网网络延迟并节省第三方 API 的调用额度。
              </li>
              <li>
                <strong className="text-slate-800">缓存过期时间 (TTL)：</strong> 大屏实时 AQI
                数据的默认缓存时间设置为较低值（短至数分钟）以保障数据新鲜度，而对于历史趋势等低频变动数据，过期时间通常设置为几小时到一天。
              </li>
              <li>
                <strong className="text-slate-800">缓存击穿保护：</strong>{' '}
                对于高并发情况下的缓存失效，后台使用了防止击穿的锁机制，确保同一时间只有一个请求真正触发数据库或第三方数据源拉取过程。
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="size-5 text-amber-600" />
              <CardTitle className="text-base font-semibold">常见问题 (FAQ)</CardTitle>
            </div>
            <CardDescription>使用过程中的常见疑问解答。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-slate-600">
            <div>
              <h5 className="font-medium text-slate-800 mb-1">
                Q: 为什么部分城市的空气质量等级更新较慢？
              </h5>
              <p>
                A:
                可能是由于国控或省控监测站点自身的数据没有即时上报，另外我方为了保障系统稳定性启用了
                Redis 缓存，正常情况下会有 10-30 分钟的延迟，此属正常现象。
              </p>
            </div>
            <div>
              <h5 className="font-medium text-slate-800 mb-1">Q: 数据轮询频率可以设置多低？</h5>
              <p>
                A: 目前在系统设置中，您最低可将大屏端轮询接口的频率设为 5
                秒。但为了减轻系统负担，通常建议保持在 60 秒以上。
              </p>
            </div>
            <div>
              <h5 className="font-medium text-slate-800 mb-1">
                Q: 如果发现系统提示 "Redis 连接失败" 怎么办？
              </h5>
              <p>
                A:
                此问题多数情况是后端服务所在的容器或节点内存溢出。此时所有请求会降级绕过缓存直接查库。请及时联系运维核查基础设施配置。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
