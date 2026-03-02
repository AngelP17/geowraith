/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DemoWorkbench } from '../demo/DemoWorkbench';
import { usePredictionWorkbench } from '../demo/usePredictionWorkbench';

export const ProductUI: React.FC = () => {
  const workbench = usePredictionWorkbench();

  return (
    <section id="product" className="bg-[#040506] py-24 md:py-32">
      <div className="w-full px-5 md:px-[120px]">
        <div className="mx-auto max-w-[1520px]">
          <DemoWorkbench
            workbench={workbench}
            onScenarioSelect={workbench.applyScenario}
          />
        </div>
      </div>
    </section>
  );
};
