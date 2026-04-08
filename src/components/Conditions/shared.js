import styled from 'styled-components';

export const NodeContainer = styled.div`
  max-height: 300px;
  max-width: 300px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
`;

export const NodeTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #102a43;
`;

export const NodeInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid #bcccdc;
  border-radius: 6px;
`;
