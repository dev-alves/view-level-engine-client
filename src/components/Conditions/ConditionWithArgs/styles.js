import styled from 'styled-components';
import { NodeContainer, NodeInput, NodeTitle } from '../shared';

export const Container = styled(NodeContainer)``;

export const Title = styled(NodeTitle)``;

export const Input = styled(NodeInput)`
  &:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
